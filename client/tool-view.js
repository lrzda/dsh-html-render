/**
 * `html_render` 工具卡片的**探针版本**。
 *
 * 目的只有一个：判定 `tool.call.toolview` 这一格到底会不会渲染插件的返回值。
 * 所以它刻意做成最不可能被样式影响的样子 —— 内联样式、红底黄框、大白字，
 * 不依赖任何外部 CSS 类，也不依赖任何数据读取。
 *
 * 如果这个红块不出现，就说明问题不在样式、不在数据，而在"这一格不渲染我们"，
 * 那就该彻底放弃这条路，转去 turnTail（已验证能显示）。
 */
import React from 'react';

const PROBE_STYLE = {
  display: 'block',
  boxSizing: 'border-box',
  padding: '18px 22px',
  minHeight: '64px',
  background: '#dc2626',
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: '700',
  lineHeight: '1.5',
  border: '3px solid #fbbf24',
  borderRadius: '12px',
  fontFamily: 'system-ui, sans-serif',
};

export function HtmlRenderRow(props) {
  // 仍然记录一次，方便和红块是否出现做对照
  try {
    fetch('/api/html-render/', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'diag',
        step: 'toolview-probe',
        phase: String(props && props.phase),
        hasBlock: Boolean(props && props.block),
      }),
    }).catch(() => {});
  } catch {
    /* 诊断失败不影响渲染 */
  }

  return React.createElement(
    'div',
    { style: PROBE_STYLE },
    'TOOLVIEW 渲染正常 —— 看到这个红块，说明工具卡片通道是通的',
  );
}
