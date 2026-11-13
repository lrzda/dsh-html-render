/**
 * Edge 进程的生命周期与页面（CDP target）的创建。
 *
 * 职责边界：
 *   - 只负责"把浏览器跑起来、给我一个能发命令的页面句柄、用完关掉"；
 *   - 不关心页面里画什么（那是 render/session.js 的事）；
 *   - 不关心导出成什么格式（那是 exporters/ 的事）。
 *
 * 进程复用策略：一次启动成本约 2–3 秒，所以整个插件共用一个进程，
 * 每次渲染只是新开一个 target。空闲太久的进程由上层调用 close() 回收。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CdpConnection } from './cdp.js';
import { findEdge } from './locator.js';

const START_TIMEOUT_MS = 20_000;
const DEVTOOLS_LINE = /DevTools listening on (ws:\/\/[^\s]+)/;

/** Edge 启动参数：无头 + 随机调试端口 + 一次性的用户数据目录。 */
function launchArgs(profileDir) {
  return [
    '--headless=new',
    '--remote-debugging-port=0', // 0 = 让系统挑一个空闲端口，从 stderr 报出来
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-networking',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate,MediaRouter',
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ];
}

/** 从 stderr 里等出 DevTools 的 WebSocket 地址。 */
function waitForDevToolsUrl(stream) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Edge did not report a DevTools address within ${START_TIMEOUT_MS}ms`));
    }, START_TIMEOUT_MS);

    const onData = (chunk) => {
      buffer += String(chunk);
      const match = DEVTOOLS_LINE.exec(buffer);
      if (match) {
        cleanup();
        resolve(match[1]);
      }
    };
    const onEnd = () => {
      cleanup();
      reject(new Error('Edge exited before reporting a DevTools address'));
    };
    const cleanup = () => {
      clearTimeout(timer);
      stream.off('data', onData);
      stream.off('end', onEnd);
      stream.off('close', onEnd);
    };

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('close', onEnd);
  });
}

export class BrowserHost {
  /**
   * @param {{ edgePath?: string, profileDir?: string }} [options]
   *   edgePath 留空则自动查找；profileDir 留空则用临时目录。
   */
  constructor(options = {}) {
    this.edgePath = options.edgePath;
    this.profileDir = options.profileDir;
    this.process = null;
    this.port = null;
    this.devToolsUrl = null;
    this.ownsProfileDir = options.profileDir === undefined;
  }

  get running() {
    return this.process !== null && this.process.exitCode === null;
  }

  /** 启动浏览器（幂等：已在跑就直接返回）。 */
  async start() {
    if (this.running) return this;

    const edge = this.edgePath ? { path: this.edgePath } : findEdge();
    this.profileDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-html-render-'));
    fs.mkdirSync(this.profileDir, { recursive: true });

    const child = spawn(edge.path, launchArgs(this.profileDir), {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });

    const startup = waitForDevToolsUrl(child.stderr);
    child.on('exit', () => {
      this.process = null;
      this.port = null;
      this.devToolsUrl = null;
    });

    try {
      this.devToolsUrl = await startup;
    } catch (error) {
      child.kill();
      throw error;
    }

    this.process = child;
    this.port = Number(new URL(this.devToolsUrl).port);
    return this;
  }

  /**
   * 开一个新页面，返回它自己的 CDP 连接。
   *
   * 用 `/json/new` 而不是直接连 browser 级连接：页面级的连接在关闭页面时
   * 会一起断开，不用手工清理 target 列表。
   *
   * @returns {Promise<{ id: string, cdp: CdpConnection, close: () => Promise<void> }>}
   */
  async newPage() {
    await this.start();
    // 新版 Chromium 要求 PUT；GET 会返回 405。
    const response = await fetch(`http://127.0.0.1:${this.port}/json/new?about:blank`, { method: 'PUT' });
    if (!response.ok) throw new Error(`Edge refused a new target: HTTP ${response.status}`);
    const target = await response.json();
    const cdp = await CdpConnection.connect(target.webSocketDebuggerUrl);
    return {
      id: target.id,
      cdp,
      close: async () => {
        cdp.close();
        try {
          await fetch(`http://127.0.0.1:${this.port}/json/close/${target.id}`);
        } catch {
          /* 页面已经没了 */
        }
      },
    };
  }

  /** 关掉浏览器，并清理本次创建的临时用户目录。 */
  async close() {
    const child = this.process;
    this.process = null;
    this.port = null;
    this.devToolsUrl = null;

    if (child && child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 3_000);
        child.once('exit', () => {
          clearTimeout(timer);
          resolve(undefined);
        });
      });
    }

    if (this.ownsProfileDir && this.profileDir) {
      try {
        fs.rmSync(this.profileDir, { recursive: true, force: true });
      } catch {
        /* 进程可能还握着文件句柄，下次启动会换个目录 */
      }
      this.profileDir = undefined;
    }
  }
}
