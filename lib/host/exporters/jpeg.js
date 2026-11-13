/**
 * JPG 导出器。
 *
 * 和 PNG 唯一的区别是 CDP 参数：格式换成 jpeg 并带质量。
 * 有损格式适合分享/预览，细节密集的界面用 PNG 更好 —— 这个判断留给调用方。
 */
export const exporter = {
  format: 'jpeg',
  mime: 'image/jpeg',
  extension: '.jpg',

  /**
   * @param {any} page 会话句柄
   * @param {{ fullPage?: boolean, quality?: number }} [options]
   * @returns {Promise<Buffer>}
   */
  async run(page, options = {}) {
    const quality = Number.isFinite(options.quality) ? Math.min(100, Math.max(1, options.quality)) : 90;
    return page.screenshot({ format: 'jpeg', quality, fullPage: options.fullPage === true });
  },
};
