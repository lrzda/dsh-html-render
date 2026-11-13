/**
 * 一个够用就好的 Chrome DevTools Protocol 客户端。
 *
 * 只做三件事：把 JSON-RPC 的请求/响应配对、把事件分发给订阅者、超时与关闭。
 * 它**不认识**任何具体命令（Page / Runtime / Emulation 都是字符串），
 * 所以增加新能力不需要改这个文件 —— 这是它和 `browser.js` 解耦的关键。
 *
 * 依赖 Node 22 自带的全局 WebSocket，不引入 ws 包。
 */

/** CDP 返回的 error 对象 → 带方法名的异常，方便定位是哪条命令失败。 */
export class CdpError extends Error {
  /**
   * @param {string} method
   * @param {{ code?: number, message?: string, data?: string }} detail
   */
  constructor(method, detail) {
    super(`CDP ${method} failed: ${detail?.message ?? 'unknown error'}${detail?.data ? ` (${detail.data})` : ''}`);
    this.name = 'CdpError';
    this.method = method;
    this.code = detail?.code;
  }
}

export class CdpTimeoutError extends Error {
  constructor(method, timeoutMs) {
    super(`CDP ${method} timed out after ${timeoutMs}ms`);
    this.name = 'CdpTimeoutError';
    this.method = method;
  }
}

export class CdpConnection {
  /**
   * @param {WebSocket} socket
   */
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    /** @type {Map<number, { resolve: Function, reject: Function, method: string, timer: NodeJS.Timeout }>} */
    this.pending = new Map();
    /** @type {Map<string, Set<(params: any) => void>>} */
    this.listeners = new Map();
    this.closed = false;

    socket.addEventListener('message', (event) => this.#onMessage(event));
    socket.addEventListener('close', () => this.#onClose());
    socket.addEventListener('error', () => this.#onClose());
  }

  /**
   * 连上一个 WebSocket 调试地址。
   *
   * @param {string} url 形如 ws://127.0.0.1:9222/devtools/page/XXXX
   * @param {{ timeoutMs?: number }} [options]
   * @returns {Promise<CdpConnection>}
   */
  static async connect(url, options = {}) {
    const timeoutMs = options.timeoutMs ?? 10_000;
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.close();
        reject(new Error(`CDP connect timed out after ${timeoutMs}ms: ${url}`));
      }, timeoutMs);
      const settle = (fn) => (event) => {
        clearTimeout(timer);
        fn(event);
      };
      socket.addEventListener('open', settle(() => resolve(undefined)), { once: true });
      socket.addEventListener('error', settle(() => reject(new Error(`CDP connect failed: ${url}`))), { once: true });
    });
    return new CdpConnection(socket);
  }

  /**
   * 发一条命令并等它的响应。
   *
   * @param {string} method 例如 'Page.captureScreenshot'
   * @param {Record<string, unknown>} [params]
   * @param {{ timeoutMs?: number }} [options]
   * @returns {Promise<any>} 响应里的 result
   */
  send(method, params = {}, options = {}) {
    if (this.closed) return Promise.reject(new Error(`CDP socket closed before ${method}`));
    const timeoutMs = options.timeoutMs ?? 30_000;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new CdpTimeoutError(method, timeoutMs));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, method, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  /**
   * 订阅一个 CDP 事件。
   *
   * @param {string} event 例如 'Page.loadEventFired'
   * @param {(params: any) => void} handler
   * @returns {() => void} 取消订阅
   */
  on(event, handler) {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    return () => set.delete(handler);
  }

  /**
   * 等一个只发生一次的事件，带超时。
   *
   * @param {string} event
   * @param {{ timeoutMs?: number }} [options]
   * @returns {Promise<any>}
   */
  once(event, options = {}) {
    const timeoutMs = options.timeoutMs ?? 30_000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`CDP event ${event} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      const off = this.on(event, (params) => {
        clearTimeout(timer);
        off();
        resolve(params);
      });
    });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.socket.close();
    } catch {
      /* 已经断了，无所谓 */
    }
  }

  #onMessage(event) {
    let message;
    try {
      message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
    } catch {
      return;
    }

    if (typeof message.id === 'number') {
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      clearTimeout(entry.timer);
      if (message.error) entry.reject(new CdpError(entry.method, message.error));
      else entry.resolve(message.result);
      return;
    }

    if (typeof message.method === 'string') {
      const set = this.listeners.get(message.method);
      if (set) for (const handler of set) handler(message.params);
    }
  }

  #onClose() {
    if (this.closed) return;
    this.closed = true;
    for (const [id, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error(`CDP socket closed while waiting for ${entry.method}`));
      this.pending.delete(id);
    }
  }
}
