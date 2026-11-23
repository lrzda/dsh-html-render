/**
 * Markdown 代码块级渲染：把 ```html 围栏渲染成沙箱 iframe。
 *
 * 这是 DSH 官方提供的"随时渲染"钩子 —— `conversation.chat.markdown.fence`，
 * 按语言名（key）接管代码块的呈现。相比 turnTail（每轮末尾只能有一个位置），
 * 它能在回答的**任意位置**出现任意多次，符合"写完就渲染"的直觉。
 *
 * 契约（来自 ui-chat 的实际调用点）：
 *   renderSlot('conversation.chat.markdown.fence', fence, {
 *     entryKey: fence.lang,
 *     children: <FenceCodeBlock …/>,   // 下一内层，最内层才是原代码块
 *   })
 * 组件拿到 `{ lang, code, streaming, meta, children }`。
 *
 * 两条必须守住的规则：
 *   1. `streaming` 为真时直接 return children —— 流式输出中间态的 HTML 是半截的，
 *      渲染它只会闪出一个残缺页面，官方 math 层也是这个策略；
 *   2. 永远给用户留一条"看源码"的退路（details），否则想看代码的人被挡住。
 */
import React from 'react';

export function HtmlFence({ code, streaming, children }) {
  // 流式中、空内容、非 HTML 语言：一律交还宿主原样
  if (streaming === true) return children;
  if (typeof code !== 'string' || code.trim() === '') return children;

  return React.createElement('div', { className: 'dhr-fence' }, [
    React.createElement('iframe', {
      key: 'frame',
      className: 'dhr-fence-frame',
      title: 'html-fence-preview',
      // 给 allow-same-origin 会让页面脚本能碰宿主 DOM；渲染预览不需要这个能力
      sandbox: 'allow-scripts allow-forms allow-modals allow-popups',
      srcDoc: code,
    }),
    React.createElement(
      'details',
      { key: 'source', className: 'dhr-fence-source' },
      React.createElement('summary', null, '查看源码'),
      children,
    ),
  ]);
}
