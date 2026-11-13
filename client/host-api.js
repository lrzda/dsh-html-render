/**
 * 客户端访问宿主的唯一出口。
 *
 * 所有请求都从这里走，好处是：错误形态统一、路由只有一个常量、
 * 将来换协议（比如改成 RPC 频道）只需要改这一个文件。
 */

const ROUTE = '/api/html-render/';

/**
 * @param {string} action
 * @param {Record<string, unknown>} [payload]
 */
async function call(action, payload = {}) {
  let response;
  try {
    response = await fetch(ROUTE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}`);
  }

  if (!response.ok || !data || data.ok !== true) {
    throw new Error((data && data.error) || `HTTP ${response.status}`);
  }
  return data;
}

export const api = {
  /** @returns {Promise<{formats: Array<{format: string, mime: string, extension: string}>}>} */
  formats: () => call('formats'),

  /**
   * 导出一份 HTML。
   * @param {{source: object, format: string, viewport?: object, options?: object}} request
   */
  exportArtifact: (request) => call('export', request),

  /** @param {number} [limit] */
  list: (limit) => call('list', { limit }),

  /** @param {string} id */
  open: (id) => call('open', { id }),

  /** @param {string} id */
  remove: (id) => call('delete', { id }),
};
