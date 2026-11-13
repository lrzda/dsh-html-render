/**
 * PDF 导出器。
 *
 * 走 Page.printToPDF。与"截图后贴进 PDF"不同，这条路是浏览器原生的打印管线：
 * 文字是矢量的、可选中、可搜索，链接也还在。
 *
 * preferCSSPageSize 交给页面自己决定纸张大小（@page 规则），页面上没写时才用
 * CDP 的默认值 —— 这样一份"为 A4 设计的报告"不会被硬塞进 Letter。
 */
export const exporter = {
  format: 'pdf',
  mime: 'application/pdf',
  extension: '.pdf',

  /**
   * @param {any} page 会话句柄
   * @param {{ printBackground?: boolean, paperWidth?: number, paperHeight?: number, margin?: number }} [options]
   * @returns {Promise<Buffer>}
   */
  async run(page, options = {}) {
    return page.printPdf({
      printBackground: options.printBackground !== false,
      paperWidth: options.paperWidth,
      paperHeight: options.paperHeight,
      margin: options.margin,
    });
  },
};
