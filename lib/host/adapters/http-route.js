/**
 * 面板的门面：一个同源的 POST 路由。
 *
 * 这一层只做三件事：校验请求形态、按 action 转发给服务层、把结果/错误转成 JSON。
 * 它不判断"能不能渲染"、也不拼文件路径 —— 那些是服务层的事。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROUTE_PREFIX = '/api/html-render/';
const MAX_BODY_BYTES = 5 * 1024 * 1024;

/**
 * 客户端自诊断落点。
 *
 * 为什么需要：浏览器里的错误不会回流到宿主，插件"看起来加载了但卡片没出现"
 * 这种情况靠猜没用。客户端在关键节点（apply 执行、卡片渲染）打一条记录，
 * 宿主追加写入这个文件，于是"加载到哪一步失败"变成可读的事实。
 */
const DIAG_FILE = path.join(
  process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh'),
  'html-render',
  'diag.jsonl',
);

function appendDiag(record) {
  try {
    fs.mkdirSync(path.dirname(DIAG_FILE), { recursive: true });
    fs.appendFileSync(DIAG_FILE, `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`, 'utf8');
  } catch {
    /* 诊断失败不应该影响任何功能 */
  }
}

/** 产物按扩展名取 MIME，供 GET 直出用。 */
const MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
};

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
    // GET：按 id 取产物字节。会话卡片用它显示渲染结果
    // （工具参数在客户端会被简化，只有产物 id 是稳定可用的）。
    if (req.method === 'GET') {
      let requestedId = '';
      try {
        const url = new URL(req.url ?? '/', 'http://localhost');
        requestedId = url.searchParams.get('id') ?? '';
        let id = requestedId;
        // id=latest 是给会话卡片用的：它不需要知道任何 id，只展示最近一次渲染结果
        if (id === 'latest') {
          const [newest] = service.list({ limit: 1 });
          if (!newest) throw new Error('no artifacts yet');
          id = newest.id;
        }
        const file = service.get(id);
        const data = fs.readFileSync(file);
        const mime = MIME_BY_EXTENSION[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
        appendDiag({ step: 'artifact-get', requestedId, resolvedId: id, bytes: data.length, mime });
        res.writeHead(200, {
          'content-type': mime,
          'cache-control': 'no-store',
          'content-length': data.length,
        });
        res.end(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendDiag({ step: 'artifact-get-failed', requestedId, error: message });
        sendJson(res, 404, { ok: false, error: message });
      }
      return;
    }

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

        case 'diag':
          appendDiag(payload);
          sendJson(res, 200, { ok: true });
          return;

        // 产物二进制。**必须走 POST**：实测 GET /api/html-render/artifact 到不了本路由
        // （日志里连一条记录都没有，说明被前端的静态资源处理截走了），
        // 而 POST 到同一前缀是通的。客户端拿到字节后用 blob URL 显示。
        case 'artifact': {
          const file = service.get(String(payload.id ?? ''));
          const data = fs.readFileSync(file);
          const mime = MIME_BY_EXTENSION[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
          appendDiag({ step: 'artifact-post', id: String(payload.id ?? ''), bytes: data.length, mime });
          res.writeHead(200, {
            'content-type': mime,
            'cache-control': 'no-store',
            'content-length': data.length,
          });
          res.end(data);
          return;
        }

        // 会话尾部卡片用：只汇报"最近一次产物"的元信息，由客户端拿本轮起始时间比对，
        // 决定这一轮到底要不要显示画面。返回 null 表示还没有任何产物。
        case 'latest': {
          const [newest] = service.list({ limit: 1 });
          sendJson(res, 200, {
            ok: true,
            artifact: newest
              ? { id: newest.id, createdAt: newest.createdAt, createdAtMs: Date.parse(newest.createdAt) }
              : null,
          });
          return;
        }

        default:
          throw new Error(`unknown action: ${action}`);
      }
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  };
}

export { ROUTE_PREFIX };
