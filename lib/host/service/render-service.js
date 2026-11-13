/**
 * 服务层：整个插件唯一的业务入口。
 *
 * 面板（HTTP）和 agent（工具）都调这里，于是"怎么校验、怎么渲染、怎么落盘"
 * 只存在一份。这一层不认识 HTTP，也不认识工具参数 schema —— 它收结构化对象、
 * 吐结构化结果。
 *
 * 它还负责两件跨调用的事：
 *   1. **浏览器复用** —— 启动一次 Edge 要 2–3 秒，不能在每次导出上重复付；
 *   2. **空闲回收** —— 没人用的时候把进程收掉，别让一个空浏览器常驻内存。
 */
import fs from 'node:fs';
import path from 'node:path';

import { BrowserHost } from '../edge/browser.js';
import { getExporter, listFormats } from '../exporters/registry.js';
import { openSession } from '../render/session.js';

/** 单次传入的 HTML 上限。4 MB 足够一份单页应用的首屏，又不会把内存吃穿。 */
const MAX_HTML_BYTES = 4 * 1024 * 1024;

/** 视口与像素比的合法区间，防止有人传 1e9 把浏览器拖死。 */
const VIEWPORT_LIMITS = {
  width: [1, 8192],
  height: [1, 8192],
  deviceScaleFactor: [0.1, 4],
};

const DEFAULT_VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 1 };

const clampInt = (value, [min, max], fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};

const clampFloat = (value, [min, max], fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

/**
 * 把外部请求收敛成一个明确、可执行的计划。
 * 所有"用户能传什么"的规则都在这里，别处不再重复校验。
 *
 * @param {any} request
 * @param {{ allowedRoots: string[] }} context
 */
export function normalizeRequest(request, context) {
  if (request === null || typeof request !== 'object') throw new Error('request must be an object');

  const source = request.source ?? {};
  const kind = source.kind;

  let content;
  if (kind === 'html') {
    content = typeof source.content === 'string' ? source.content : '';
    if (Buffer.byteLength(content, 'utf8') > MAX_HTML_BYTES) {
      throw new Error(`html content exceeds ${MAX_HTML_BYTES} bytes`);
    }
  } else if (kind === 'file') {
    const raw = typeof source.path === 'string' ? source.path : '';
    if (raw === '') throw new Error('source.path is required for kind "file"');
    const file = path.resolve(raw);
    const inside = context.allowedRoots.some((root) => {
      const relative = path.relative(path.resolve(root), file);
      return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
    });
    if (!inside) throw new Error(`source.path is outside the allowed roots: ${file}`);
    content = fs.readFileSync(file, 'utf8');
  } else if (kind === 'url') {
    const url = typeof source.url === 'string' ? source.url : '';
    if (!/^https?:\/\//i.test(url)) throw new Error('source.url must be an http(s) URL');
  } else {
    throw new Error(`unsupported source.kind: ${String(kind)}`);
  }

  const format = String(request.format ?? 'png');
  const exporter = getExporter(format); // 未知格式在这里就抛错

  const viewportInput = request.viewport ?? {};
  const viewport = {
    width: clampInt(viewportInput.width, VIEWPORT_LIMITS.width, DEFAULT_VIEWPORT.width),
    height: clampInt(viewportInput.height, VIEWPORT_LIMITS.height, DEFAULT_VIEWPORT.height),
    deviceScaleFactor: clampFloat(
      viewportInput.deviceScaleFactor,
      VIEWPORT_LIMITS.deviceScaleFactor,
      DEFAULT_VIEWPORT.deviceScaleFactor,
    ),
  };

  const options = request.options ?? {};

  return {
    exporter,
    format,
    source: kind === 'url' ? { kind: 'url', url: source.url } : { kind: 'html', content },
    viewport,
    options: {
      fullPage: options.fullPage === true,
      quality: options.quality,
      printBackground: options.printBackground,
      paperWidth: options.paperWidth,
      paperHeight: options.paperHeight,
      margin: options.margin,
    },
    actions: Array.isArray(request.actions) ? request.actions : [],
    waitForSelector: typeof request.waitForSelector === 'string' ? request.waitForSelector : undefined,
    timeoutMs: Number.isFinite(request.timeoutMs) ? request.timeoutMs : undefined,
  };
}

/**
 * @param {{
 *   artifacts: ReturnType<import('./artifacts.js').createArtifactStore>,
 *   allowedRoots?: string[],
 *   idleMs?: number,
 *   browserFactory?: () => BrowserHost,
 * }} options
 */
export function createRenderService(options) {
  const { artifacts } = options;
  const allowedRoots = options.allowedRoots ?? [process.cwd()];
  const idleMs = options.idleMs ?? 5 * 60_000;
  const browserFactory = options.browserFactory ?? (() => new BrowserHost());

  /** @type {BrowserHost | null} */
  let browser = null;
  /** @type {NodeJS.Timeout | null} */
  let idleTimer = null;
  /** 串行化：同一时刻只让一个渲染任务占用浏览器，避免争抢 target。 */
  let queue = Promise.resolve();

  async function ensureBrowser() {
    if (browser?.running) return browser;
    browser = browserFactory();
    await browser.start();
    return browser;
  }

  function scheduleIdleShutdown() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      void shutdown();
    }, idleMs);
    // 让挂着的定时器不阻塞进程退出
    idleTimer.unref?.();
  }

  async function shutdown() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    const current = browser;
    browser = null;
    if (current) await current.close().catch(() => {});
  }

  /** 把任务排进队列，保证浏览器同一时刻只服务一个渲染。 */
  function enqueue(task) {
    const run = queue.then(task, task);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function runExport(request) {
    const plan = normalizeRequest(request, { allowedRoots });

    return enqueue(async () => {
      const host = await ensureBrowser();
      const page = await openSession(host, {
        source: plan.source,
        viewport: plan.viewport,
        actions: plan.actions,
        waitForSelector: plan.waitForSelector,
        timeoutMs: plan.timeoutMs,
      });
      try {
        const buffer = await plan.exporter.run(page, plan.options);
        const metrics = await page.metrics();
        const saved = artifacts.save(buffer, {
          extension: plan.exporter.extension,
          mime: plan.exporter.mime,
        });
        return {
          ...saved,
          format: plan.format,
          width: metrics.width,
          height: metrics.height,
          viewport: plan.viewport,
        };
      } finally {
        await page.close().catch(() => {});
        scheduleIdleShutdown();
      }
    });
  }

  return {
    export: runExport,
    formats: listFormats,
    list: (options_) => artifacts.list(options_),
    get: (id) => artifacts.get(id),
    remove: (id) => artifacts.remove(id),
    shutdown,
  };
}
