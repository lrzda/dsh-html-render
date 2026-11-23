/**
 * 面板样式。
 *
 * 约定：
 *   - 颜色全部走 `--dsw-alias-*` 主题 token，并给一层回退值，跟随宿主深浅色；
 *   - 所有类名以 `dhr-` 开头，避免和宿主或其它插件的样式打架；
 *   - 尺寸用 rem/px 混排，避免依赖根字号。
 */
export const CSS = `
.dhr-panel {
  display: flex; flex-direction: column; gap: 12px;
  height: 100%; min-height: 0; padding: 16px 18px 18px;
  color: var(--dsw-alias-label-primary, #e6e8ee);
  font-size: 14px;
}
.dhr-header { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.dhr-title { font-size: 18px; font-weight: 600; letter-spacing: .01em; }
.dhr-subtitle { color: var(--dsw-alias-label-secondary, #98a2b3); font-size: 13px; }

.dhr-toolbar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 12px; border-radius: 14px;
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.04));
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.08));
}
.dhr-toolbar .dhr-spacer { flex: 1; }

.dhr-btn {
  appearance: none; border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.12));
  background: transparent; color: inherit; font: inherit;
  height: 32px; padding: 0 14px; border-radius: 16px; cursor: pointer;
  transition: background .12s ease, border-color .12s ease;
}
.dhr-btn:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-3, rgba(255,255,255,.08)); }
.dhr-btn:disabled { opacity: .5; cursor: default; }
.dhr-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #4d6bfe); outline-offset: 1px; }
.dhr-btn-primary {
  background: var(--dsw-alias-brand-primary, #4d6bfe); border-color: transparent; color: #fff;
}
.dhr-btn-primary:hover:not(:disabled) { filter: brightness(1.08); }

.dhr-field { display: inline-flex; align-items: center; gap: 6px; }
.dhr-label { color: var(--dsw-alias-label-secondary, #98a2b3); font-size: 12px; }
.dhr-select, .dhr-input-number {
  height: 30px; box-sizing: border-box; padding: 0 10px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.12));
  background: var(--dsw-alias-bg-module-platform, rgba(0,0,0,.2));
  color: inherit; font: inherit;
}
.dhr-input-number { width: 76px; }

.dhr-body { display: grid; grid-template-columns: minmax(240px, 320px) 1fr; gap: 12px; min-height: 0; flex: 1; }
@media (max-width: 900px) { .dhr-body { grid-template-columns: 1fr; } }

.dhr-col { display: flex; flex-direction: column; gap: 8px; min-height: 0; }
.dhr-col-title { font-size: 12px; letter-spacing: .04em; text-transform: uppercase;
  color: var(--dsw-alias-label-secondary, #98a2b3); }

.dhr-textarea {
  flex: 1; min-height: 160px; resize: none; box-sizing: border-box; width: 100%;
  padding: 10px 12px; border-radius: 12px; font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: 12.5px; line-height: 1.55;
  background: var(--dsw-alias-bg-module-platform, rgba(0,0,0,.28));
  color: var(--dsw-alias-label-primary, #e6e8ee);
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.1));
}
.dhr-textarea:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #4d6bfe); outline-offset: 1px; }

.dhr-hint { font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary, #98a2b3); }

.dhr-preview-shell {
  flex: 1; min-height: 240px; border-radius: 14px; overflow: hidden;
  background: #fff; border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.1));
  display: flex; align-items: stretch;
}
.dhr-preview-frame { flex: 1; width: 100%; border: 0; background: #fff; }
.dhr-preview-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: #64748b; font-size: 13px; background: var(--dsw-alias-bg-layer-2, #0f172a);
}

.dhr-menu { position: relative; display: inline-flex; }
.dhr-menu-pop {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 40; min-width: 180px;
  padding: 6px; border-radius: 12px; display: flex; flex-direction: column; gap: 2px;
  background: var(--dsw-alias-bg-elevated, #1b2436);
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.14));
  box-shadow: 0 16px 40px rgba(0,0,0,.45);
}
.dhr-menu-item {
  appearance: none; border: 0; background: transparent; color: inherit; font: inherit; text-align: left;
  padding: 8px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px;
}
.dhr-menu-item:hover { background: var(--dsw-alias-bg-layer-3, rgba(255,255,255,.08)); }
.dhr-menu-item small { color: var(--dsw-alias-label-secondary, #98a2b3); margin-left: auto; }

.dhr-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; overflow: auto; }
.dhr-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.04));
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.07));
}
.dhr-item-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.dhr-item-name { font-family: ui-monospace, Consolas, monospace; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dhr-item-meta { font-size: 11.5px; color: var(--dsw-alias-label-secondary, #98a2b3); }
.dhr-item-actions { display: flex; gap: 4px; flex: none; }

.dhr-notice { font-size: 12.5px; padding: 8px 12px; border-radius: 10px; }
.dhr-notice-ok { background: rgba(52,211,153,.12); color: #6ee7b7; }
.dhr-notice-error { background: rgba(248,113,113,.12); color: #fca5a5; }

/* 会话内的 html_render 工具卡片 */
.dhr-tv {
  display: flex; flex-direction: column; gap: 8px; margin: 8px 0;
  padding: 10px 12px; border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.04));
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.1));
}
.dhr-tv-head { display: flex; align-items: center; gap: 8px; }
.dhr-tv-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: #94a3b8; }
.dhr-tv-dot[data-state="run"] { background: #fbbf24; }
.dhr-tv-dot[data-state="ok"] { background: #34d399; }
.dhr-tv-dot[data-state="error"] { background: #f87171; }
.dhr-tv-title { font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary, #e6e8ee); }
.dhr-tv-meta { font-size: 11.5px; color: var(--dsw-alias-label-secondary, #98a2b3); font-family: ui-monospace, Consolas, monospace; }
.dhr-tv-toggle {
  margin-left: auto; appearance: none; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.14));
  background: transparent; color: inherit; font: inherit; font-size: 12px;
  height: 24px; padding: 0 10px; border-radius: 12px;
}
.dhr-tv-toggle:hover { background: var(--dsw-alias-bg-layer-3, rgba(255,255,255,.08)); }
.dhr-tv-body { margin-top: 6px; }
.dhr-tv-body > summary {
  cursor: pointer; font-size: 12px; color: #93c5fd; padding: 2px 0;
  list-style: none;
}
.dhr-tv-body > summary::-webkit-details-marker { display: none; }
.dhr-tv-body > summary::before { content: '▸ '; }
.dhr-tv-body[open] > summary::before { content: '▾ '; }

/* html 围栏渲染成沙箱 iframe（注意：本文件是模板字符串，注释里不要出现反引号） */
.dhr-fence {
  margin: 10px 0; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.12));
  background: #0b1020;
}
.dhr-fence-frame {
  display: block; width: 100%; height: 420px; border: 0; background: #fff;
}
.dhr-fence-source {
  padding: 6px 12px 8px; font-size: 12px;
  border-top: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.08));
  color: var(--dsw-alias-label-secondary, #98a2b3);
}
.dhr-fence-source > summary { cursor: pointer; padding: 2px 0; }

/* 会话 turn 尾部的渲染结果卡片 */
.dhr-tail {
  display: inline-flex; align-items: center; gap: 8px; margin: 6px 0;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(77,107,254,.14); border: 1px solid rgba(77,107,254,.5);
  font-size: 12px; color: #93c5fd;
}
.dhr-tail-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #4d6bfe;
  box-shadow: 0 0 8px rgba(77,107,254,.9);
}
.dhr-tail-text { font-weight: 600; }
.dhr-tail-sub { color: var(--dsw-alias-label-secondary, #98a2b3); }
.dhr-tail-wrap { display: flex; flex-direction: column; gap: 8px; margin: 10px 0 4px; }
.dhr-tail-link { display: block; text-decoration: none; }
.dhr-tail-image {
  display: block; width: 100%; max-width: 720px; height: auto; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.12));
  background: #fff; cursor: zoom-in;
}
/* 点击放大：贴满视口，再点一次还原（不依赖新标签页与 blob 生命周期） */
.dhr-tail-image-zoom {
  position: fixed; inset: 0; z-index: 9999;
  width: 100vw; height: 100vh; max-width: none;
  object-fit: contain; border-radius: 0; border: 0;
  background: rgba(3, 7, 18, .92); cursor: zoom-out;
}
.dhr-tv-frame {
  width: 100%; border: 0; border-radius: 10px; background: #fff; display: block;
  transition: height .16s ease;
}
.dhr-tv-image {
  display: block; width: 100%; height: auto; border-radius: 10px; background: #fff;
  border: 1px solid var(--dsw-alias-border-default, rgba(255,255,255,.1));
}
.dhr-tv-result {
  font-family: ui-monospace, Consolas, monospace; font-size: 11.5px; line-height: 1.6;
  white-space: pre-wrap; color: var(--dsw-alias-label-secondary, #98a2b3);
  max-height: 88px; overflow: auto;
}
.dhr-tv-error {
  margin: 8px 0; padding: 10px 12px; border-radius: 10px;
  background: rgba(248,113,113,.12); border: 1px solid rgba(248,113,113,.4);
  color: #fca5a5; font-family: ui-monospace, Consolas, monospace; font-size: 12px;
}
`;

/** 把样式插进文档 head，返回移除函数（供 ctx.effect 清理）。 */
export function insertStyles(id, css) {
  const element = document.createElement('style');
  element.dataset.plugin = id;
  element.textContent = css;
  document.head.appendChild(element);
  return () => {
    if (element.parentNode) element.parentNode.removeChild(element);
  };
}
