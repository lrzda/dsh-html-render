/**
 * 面板的门面：一个同源的 POST 路由。
 *
 * 这一层只做三件事：校验请求形态、按 action 转发给服务层、把结果/错误转成 JSON。
 * 它不判断"能不能渲染"、也不拼文件路径 —— 那些是服务层的事。
 */
import { spawn } from 'node:child_process';

const ROUTE_PREFIX = '/api/html-render/';
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const sendJson = (res, status, value) => {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
};

/** 只接受同源页面发起的请求，挡住被其他站点驱动的情况。 */
const sameOrigin = (req) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin === undefined || host === undefined) return true;
  return origin === `http://${host}` || origin === `https://${host}`;
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        // 继续排空而不是 destroy：让调用方拿到 413 而不是一个断开的连接
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        reject(new Error(`request body exceeds ${MAX_BODY_BYTES} bytes`));
        return;
      }
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {});
      } catch {
        reject(new Error('request body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });

/** 在资源管理器里定位一个产物。 */
function revealInExplorer(file) {
  spawn('explorer.exe', [`/select,${file}`], { detached: true, stdio: 'ignore' }).unref();
}

/**
 * @param {{ service: ReturnType<import('../service/render-service.js').createRenderService> }} options
 */
export function createHttpRoute(options) {
  const { service } = options;

  return async function handle(req, res) {
    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'method not allowed' });
      return;
    }
    if (!sameOrigin(req)) {
      sendJson(res, 403, { ok: false, error: 'origin rejected' });
      return;
    }

    try {
      const payload = await readBody(req);
      const action = typeof payload.action === 'string' ? payload.action : '';

      switch (action) {
        case 'formats':
          sendJson(res, 200, { ok: true, formats: service.formats() });
          return;

        case 'export': {
          const result = await service.export(payload);
          sendJson(res, 200, { ok: true, ...result });
          return;
        }

        case 'list':
          sendJson(res, 200, { ok: true, artifacts: service.list({ limit: payload.limit }) });
          return;

        case 'open': {
          const file = service.get(String(payload.id ?? ''));
          revealInExplorer(file);
          sendJson(res, 200, { ok: true, opened: file });
          return;
        }

        case 'delete':
          sendJson(res, 200, { ok: true, ...service.remove(String(payload.id ?? '')) });
          return;

        default:
          throw new Error(`unknown action: ${action}`);
      }
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };
}

export { ROUTE_PREFIX };
