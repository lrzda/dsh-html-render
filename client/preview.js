/**
 * 预览区：一个真 iframe。
 *
 * 为什么用 iframe 而不是把 HTML 塞进当前 DOM：
 *   1. 页面里的 CSS 会污染宿主界面，反过来宿主样式也会影响预览；
 *   2. 页面的 <script> 需要在隔离的文档里跑；
 *   3. 只有真 iframe 才有完整的交互（点击、表单、动画、焦点）。
 *
 * sandbox 的取舍：
 *   allow-scripts  页面脚本要能跑（图表库、交互组件）；
 *   allow-same-origin  允许父页面读它的 DOM —— 导出时要抓 outerHTML 快照；
 *   allow-forms / allow-modals  表单与 alert 之类。
 * 刻意**不给** allow-top-navigation：「点了个链接把 DSH 整个页面带跑」这种事故不值得。
 */
export function createPreview(React) {
  const h = React.createElement;

  return function Preview({ html, frameRef, emptyHint }) {
    if (!html) {
      return h('div', { className: 'dhr-preview-empty' }, emptyHint);
    }
    return h('div', { className: 'dhr-preview-shell' }, [
      h('iframe', {
        key: 'frame',
        ref: frameRef,
        className: 'dhr-preview-frame',
        title: 'html-preview',
        sandbox: 'allow-scripts allow-same-origin allow-forms allow-modals allow-popups',
        srcDoc: html,
      }),
    ]);
  };
}

/**
 * 从 iframe 里抓"此刻的 DOM 快照"。
 *
 * 这是"导出带交互状态"的实现：用户在 iframe 里点了 tab、填了表单之后，
 * 直接序列化当前 DOM，而不是回头去用原始 HTML —— 后者会把交互结果全丢掉。
 *
 * @param {HTMLIFrameElement | null} frame
 * @returns {string} 完整的 HTML 文档字符串
 */
export function snapshotFrame(frame) {
  const doc = frame?.contentDocument;
  if (!doc || !doc.documentElement) return '';
  const html = doc.documentElement.outerHTML;
  return html.startsWith('<!') ? html : `<!doctype html>\n${html}`;
}
