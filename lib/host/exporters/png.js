/**
 * PNG 导出器。
 *
 * 导出器的统一契约（四个字段 + 一个方法）：
 *   format    格式名，注册表用它做 key
 *   mime      给 HTTP 响应和 UI 用
 *   extension 落盘后缀
 *   run(page, options) -> Promise<Buffer>
 *
 * 这里刻意不做任何"要不要整页"的判断 —— 那是调用方（服务层）的决定，
 * 导出器只负责把已经决定好的事情执行掉。
 */
export const exporter = {
  format: 'png',
  mime: 'image/png',
  extension: '.png',

  /**
   * @param {ReturnType<import('../render/session.js').openSession> extends Promise<infer T> ? T : never} page
   * @param {{ fullPage?: boolean }} [options]
   * @returns {Promise<Buffer>}
   */
  async run(page, options = {}) {
    return page.screenshot({ format: 'png', fullPage: options.fullPage === true });
  },
};
