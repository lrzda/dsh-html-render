/**
 * SVG 导出器。
 *
 * 这里必须先说清一个现实：**"任意网页"没有无损的 SVG 表达**。
 * SVG 是矢量图形格式，而网页是盒子模型 —— 唯一能把 HTML 塞进 SVG 的手段是
 * `<foreignObject>`，而它内部的 HTML 需要是合法 XML，且很多渲染器（Illustrator、
 * 部分 Office 版本）根本不认 foreignObject 里的内容。
 *
 * 所以本导出器按可靠性分成两条路：
 *
 *   1. **原生 SVG**（可靠）：页面的主体本身就是一个 `<svg>`，直接序列化它。
 *      数据图表、图标、示意图属于这一类，导出的就是真矢量，无限缩放。
 *   2. **foreignObject 包装**（尽力而为）：把 body 子树 + 页面里的 `<style>`
 *      包进 foreignObject。生成后会先用 DOMParser 校验是否为合法 XML，
 *      不合法就明确抛错，而不是交出一个打不开的文件。
 *
 * 两条路都失败时抛出可读的错误，让调用方去选 PNG —— 那才是网页截图的正确格式。
 */

/** 在页面里挑出"最像主体"的那个 svg：按渲染面积取最大，排除小图标。 */
const EXTRACT_NATIVE_SVG = `
  (() => {
    const candidates = [...document.querySelectorAll('svg')].map((el) => {
      const rect = el.getBoundingClientRect();
      return { el, area: rect.width * rect.height };
    });
    candidates.sort((a, b) => b.area - a.area);
    const best = candidates[0];
    if (!best || best.area < 100) return null;          // 只有图标级别的小 svg，不算主体
    const clone = best.el.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return new XMLSerializer().serializeToString(clone);
  })()
`;

/** 把 body 子树和样式包进 foreignObject，并用 DOMParser 自检是否为合法 XML。 */
const WRAP_FOREIGN_OBJECT = `
  (() => {
    const root = document.documentElement;
    const width = Math.max(root.scrollWidth, root.clientWidth);
    const height = Math.max(root.scrollHeight, root.clientHeight);

    const styles = [...document.querySelectorAll('style')]
      .map((node) => node.textContent || '')
      .join('\\n');

    const body = document.body ? document.body.innerHTML : root.innerHTML;

    // foreignObject 里没有 <body> 元素，所以页面里的 body { background: … }
    // 那条规则匹配不到任何东西 —— 导出的 SVG 会丢掉整页背景。
    // 把 body（以及 html）的计算样式抽成内联样式贴到包装 div 上，
    // 是最省事、也最接近"看起来和截图一样"的做法。
    const inline = (() => {
      if (!document.body) return '';
      const wanted = [
        'background-color', 'background-image', 'color',
        'font-family', 'font-size', 'font-weight', 'line-height',
        'padding', 'margin', 'text-align', 'letter-spacing',
      ];
      const bodyStyle = getComputedStyle(document.body);
      const htmlStyle = getComputedStyle(root);
      return wanted
        .map((prop) => {
          const value = bodyStyle.getPropertyValue(prop) || htmlStyle.getPropertyValue(prop);
          return value ? prop + ':' + value + ';' : '';
        })
        .join('');
    })();

    // 属性值里可能有双引号（font-family 常见），直接拼会破坏 style 属性
    const inlineSafe = inline.replace(/"/g, '&quot;');

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">'
      + '<foreignObject x="0" y="0" width="100%" height="100%">'
      + '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + width + 'px;min-height:' + height + 'px;' + inlineSafe + '">'
      + '<style>' + styles + '</style>'
      + body
      + '</div></foreignObject></svg>';

    // 自检：不是合法 XML 就返回 null，绝不交出打不开的文件
    const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
    if (parsed.getElementsByTagName('parsererror').length > 0) return null;
    return svg;
  })()
`;

export const exporter = {
  format: 'svg',
  mime: 'image/svg+xml',
  extension: '.svg',

  /**
   * @param {any} page 会话句柄
   * @returns {Promise<Buffer>}
   */
  async run(page) {
    const native = await page.evaluate(EXTRACT_NATIVE_SVG);
    if (typeof native === 'string' && native.trim() !== '') {
      return Buffer.from(native, 'utf8');
    }

    const wrapped = await page.evaluate(WRAP_FOREIGN_OBJECT);
    if (typeof wrapped === 'string' && wrapped.trim() !== '') {
      return Buffer.from(wrapped, 'utf8');
    }

    throw new Error(
      'svg export needs either a native <svg> in the page or HTML that serialises to valid XML. ' +
        'Use png or pdf for general web pages.',
    );
  },
};
