/**
 * 一次渲染会话的全部生命周期：把内容装进页面 → 等它画好 → 执行可选交互 → 交出手柄 → 关闭。
 *
 * 这一层是"渲染"这个动作的完整定义。它对外只暴露一个 `openSession`，
 * 对内把 CDP 的细节包在 evaluate / screenshot / printPdf / metrics 四个动作后面。
 *
 * 导出器（exporters/）只认这四件事，永远看不到 CDP 命令名 —— 这是换引擎时
 * 不用动导出器的原因。
 */
import { waitForReady } from './waits.js';

const DEFAULT_VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 1 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 把 CDP 的 Runtime.evaluate 包成一个"求值，出错就抛"的函数。 */
function makeEvaluate(cdp) {
  return async function evaluate(expression) {
    const response = await cdp.send('Runtime.evaluate', {
      expression,
      awaitPromise: true, // 让页面里的 Promise 能直接 await
      returnByValue: true,
      userGesture: true, // 允许脚本触发需要用户手势的 API（如 requestFullscreen）
    });
    if (response.exceptionDetails) {
      const detail = response.exceptionDetails;
      const text = detail.exception?.description ?? detail.text ?? 'unknown script error';
      throw new Error(`page script failed: ${text}`);
    }
    return response.result.value;
  };
}

/** 设定视口与像素比（决定导出分辨率）。 */
async function applyViewport(cdp, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: false,
  });
}

/**
 * 把内容放进页面。
 *
 * 用 setDocumentContent 而不是 data: URL：data URL 有长度上限（Chromium 约 2 MB，
 * 且会随编码膨胀），而 setDocumentContent 直接把字符串交给渲染进程，没有这个天花板。
 *
 * @param {import('../edge/cdp.js').CdpConnection} cdp
 * @param {{ kind: 'html' | 'url', content?: string, url?: string }} source
 */
async function loadContent(cdp, source) {
  if (source.kind === 'url') {
    await cdp.send('Page.navigate', { url: source.url });
    return;
  }
  const { frameTree } = await cdp.send('Page.getFrameTree');
  await cdp.send('Page.setDocumentContent', {
    frameId: frameTree.frame.id,
    html: source.content ?? '',
  });
}

/**
 * 执行交互序列。这是"导出的截图能反映操作后的状态"和"agent 也能模拟点击"的实现基础。
 *
 * 支持的步骤：
 *   { type: 'click',   selector }            点击一个元素
 *   { type: 'type',    selector, text }      填入文本并派发 input/change 事件
 *   { type: 'scroll',  x?, y? }              滚动（默认滚到底）
 *   { type: 'eval',    script }              任意页面脚本
 *   { type: 'wait',    ms }                  固定延时
 *   { type: 'waitFor', selector, timeoutMs? } 等某个元素出现（例如异步加载的图表）
 *
 * @param {(expression: string) => Promise<any>} evaluate
 * @param {Array<Record<string, any>>} actions
 */
async function runActions(evaluate, actions) {
  for (const [index, action] of actions.entries()) {
    const where = `actions[${index}] (${String(action?.type)})`;
    switch (action?.type) {
      case 'click':
        await evaluate(`
          (() => {
            const el = document.querySelector(${JSON.stringify(action.selector)});
            if (!el) throw new Error('selector not found: ' + ${JSON.stringify(action.selector)});
            el.click();
            return true;
          })()
        `);
        break;

      case 'type':
        await evaluate(`
          (() => {
            const el = document.querySelector(${JSON.stringify(action.selector)});
            if (!el) throw new Error('selector not found: ' + ${JSON.stringify(action.selector)});
            el.focus();
            el.value = ${JSON.stringify(action.text ?? '')};
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          })()
        `);
        break;

      case 'scroll':
        await evaluate(`
          (() => {
            window.scrollTo(${Number(action.x ?? 0)}, ${Number(action.y ?? 1e9)});
            return true;
          })()
        `);
        break;

      case 'eval':
        await evaluate(String(action.script ?? 'true'));
        break;

      case 'wait':
        await sleep(Number(action.ms ?? 200));
        break;

      case 'waitFor': {
        const timeoutMs = Number(action.timeoutMs ?? 10_000);
        await waitForReady(evaluate, { timeoutMs, waitForSelector: action.selector });
        break;
      }

      default:
        throw new Error(`unsupported action at ${where}`);
    }
  }
}

/** 把一次页面连接包装成导出器认识的"会话句柄"。 */
function makeHandle({ page, cdp, evaluate, viewport }) {
  return {
    cdp,
    evaluate,
    viewport,

    /**
     * 截一张图。
     * @param {{ format?: 'png' | 'jpeg', quality?: number, fullPage?: boolean }} [options]
     * @returns {Promise<Buffer>}
     */
    async screenshot(options = {}) {
      const format = options.format ?? 'png';
      const result = await cdp.send('Page.captureScreenshot', {
        format,
        ...(format === 'jpeg' ? { quality: options.quality ?? 90 } : {}),
        // captureBeyondViewport 让整页截图绕过视口高度限制
        captureBeyondViewport: options.fullPage === true,
        fromSurface: true,
      });
      return Buffer.from(result.data, 'base64');
    },

    /**
     * 打印成 PDF。
     * @param {{ printBackground?: boolean, paperWidth?: number, paperHeight?: number, margin?: number }} [options]
     * @returns {Promise<Buffer>}
     */
    async printPdf(options = {}) {
      const margin = options.margin ?? 0;
      const result = await cdp.send('Page.printToPDF', {
        printBackground: options.printBackground !== false,
        preferCSSPageSize: true,
        marginTop: margin,
        marginBottom: margin,
        marginLeft: margin,
        marginRight: margin,
        ...(options.paperWidth ? { paperWidth: options.paperWidth } : {}),
        ...(options.paperHeight ? { paperHeight: options.paperHeight } : {}),
      });
      return Buffer.from(result.data, 'base64');
    },

    /**
     * 当前页面的实际尺寸。整页截图和 PDF 都靠它报尺寸。
     * @returns {Promise<{ width: number, height: number, viewportWidth: number, viewportHeight: number }>}
     */
    async metrics() {
      const { cssContentSize, cssLayoutViewport } = await cdp.send('Page.getLayoutMetrics');
      return {
        width: Math.ceil(cssContentSize.width),
        height: Math.ceil(cssContentSize.height),
        viewportWidth: cssLayoutViewport.clientWidth,
        viewportHeight: cssLayoutViewport.clientHeight,
      };
    },

    close: () => page.close(),
  };
}

/**
 * 打开一次渲染会话。
 *
 * @param {import('../edge/browser.js').BrowserHost} browser
 * @param {{
 *   source: { kind: 'html' | 'url', content?: string, url?: string },
 *   viewport?: Partial<typeof DEFAULT_VIEWPORT>,
 *   actions?: Array<Record<string, any>>,
 *   timeoutMs?: number,
 *   settleMs?: number,
 *   waitForSelector?: string,
 * }} spec
 */
export async function openSession(browser, spec) {
  const viewport = { ...DEFAULT_VIEWPORT, ...(spec.viewport ?? {}) };
  const page = await browser.newPage();

  try {
    const { cdp } = page;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await applyViewport(cdp, viewport);
    await loadContent(cdp, spec.source);

    const evaluate = makeEvaluate(cdp);
    await waitForReady(evaluate, {
      timeoutMs: spec.timeoutMs,
      settleMs: spec.settleMs,
      waitForSelector: spec.waitForSelector,
    });

    if (Array.isArray(spec.actions) && spec.actions.length > 0) {
      await runActions(evaluate, spec.actions);
    }

    return makeHandle({ page, cdp, evaluate, viewport });
  } catch (error) {
    // 失败时一定要关掉页面，否则一个坏页面会一直挂在浏览器里。
    await page.close().catch(() => {});
    throw error;
  }
}
