window.__ModuleLoader__.load({ id: 'dsh-html-render', factory(require) {
const module = { exports: {} };
const exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.js
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

// client/i18n.js
var zh = {
  open: "HTML \u6E32\u67D3",
  title: "HTML \u6E32\u67D3\u4E0E\u5BFC\u51FA",
  subtitle: "\u5728\u9762\u677F\u91CC\u4EA4\u4E92\u9884\u89C8\uFF0C\u9009\u4E2D\u683C\u5F0F\u4E00\u952E\u5BFC\u51FA\u3002",
  source: "HTML \u6E90",
  sourceHint: "\u7C98\u8D34 HTML\uFF0C\u6216\u4ECE\u6587\u4EF6\u8F7D\u5165\u3002\u9884\u89C8\u5728\u6C99\u7BB1 iframe \u91CC\u5B9E\u65F6\u6E32\u67D3\uFF0C\u811A\u672C\u4E0E\u6837\u5F0F\u90FD\u4F1A\u6267\u884C\u3002",
  placeholder: "<!doctype html>\n<html>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>",
  loadFile: "\u4ECE\u6587\u4EF6\u8F7D\u5165",
  fileLoaded: "\u5DF2\u8F7D\u5165",
  apply: "\u5E94\u7528\u5230\u9884\u89C8",
  clear: "\u6E05\u7A7A",
  export: "\u5BFC\u51FA",
  exporting: "\u5BFC\u51FA\u4E2D\u2026",
  format: "\u683C\u5F0F",
  fullPage: "\u6574\u9875\u622A\u56FE",
  scale: "\u50CF\u7D20\u6BD4",
  artifacts: "\u6700\u8FD1\u4EA7\u7269",
  artifactsEmpty: "\u8FD8\u6CA1\u6709\u5BFC\u51FA\u8FC7\u3002\u9009\u4E2A\u683C\u5F0F\uFF0C\u70B9\u300C\u5BFC\u51FA\u300D\u8BD5\u8BD5\u3002",
  openArtifact: "\u5728\u8D44\u6E90\u7BA1\u7406\u5668\u4E2D\u663E\u793A",
  removeArtifact: "\u5220\u9664",
  refresh: "\u5237\u65B0",
  exportingDone: "\u5DF2\u5BFC\u51FA",
  exportFailed: "\u5BFC\u51FA\u5931\u8D25",
  loadFailed: "\u8F7D\u5165\u5931\u8D25",
  listFailed: "\u4EA7\u7269\u6E05\u5355\u8BFB\u53D6\u5931\u8D25",
  sizeHint: "\u5BFC\u51FA\u5206\u8FA8\u7387",
  bytes: "\u5927\u5C0F",
  createdAt: "\u65F6\u95F4",
  previewEmpty: "\u5DE6\u4FA7\u586B\u5165 HTML \u540E\u70B9\u300C\u5E94\u7528\u5230\u9884\u89C8\u300D\u3002",
  width: "\u5BBD",
  height: "\u9AD8"
};
var en = {
  open: "HTML Render",
  title: "HTML render and export",
  subtitle: "Preview interactively in the panel, then export in one click.",
  source: "HTML source",
  sourceHint: "Paste HTML or load a file. The preview renders in a sandboxed iframe, so styles and scripts run.",
  placeholder: "<!doctype html>\n<html>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>",
  loadFile: "Load file",
  fileLoaded: "Loaded",
  apply: "Apply to preview",
  clear: "Clear",
  export: "Export",
  exporting: "Exporting\u2026",
  format: "Format",
  fullPage: "Full page",
  scale: "Scale",
  artifacts: "Recent artifacts",
  artifactsEmpty: "Nothing exported yet. Pick a format and press Export.",
  openArtifact: "Show in Explorer",
  removeArtifact: "Delete",
  refresh: "Refresh",
  exportingDone: "Exported",
  exportFailed: "Export failed",
  loadFailed: "Load failed",
  listFailed: "Could not read the artifact list",
  sizeHint: "Output resolution",
  bytes: "Size",
  createdAt: "Created",
  previewEmpty: "Fill in the HTML on the left, then press Apply to preview.",
  width: "Width",
  height: "Height"
};

// client/fence.js
var import_react = __toESM(require("react"), 1);
function HtmlFence({ code, streaming, children }) {
  if (streaming === true) return children;
  if (typeof code !== "string" || code.trim() === "") return children;
  return import_react.default.createElement("div", { className: "dhr-fence" }, [
    import_react.default.createElement("iframe", {
      key: "frame",
      className: "dhr-fence-frame",
      title: "html-fence-preview",
      // 给 allow-same-origin 会让页面脚本能碰宿主 DOM；渲染预览不需要这个能力
      sandbox: "allow-scripts allow-forms allow-modals allow-popups",
      srcDoc: code
    }),
    import_react.default.createElement(
      "details",
      { key: "source", className: "dhr-fence-source" },
      import_react.default.createElement("summary", null, "\u67E5\u770B\u6E90\u7801"),
      children
    )
  ]);
}

// client/turn-tail.js
var import_react2 = __toESM(require("react"), 1);
var { useState, useEffect } = import_react2.default;
var JSON_HEADERS = { "content-type": "application/json" };
async function postJson(body) {
  const response = await fetch("/api/html-render/", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  });
  if (!response.ok) return null;
  return response.json();
}
function TurnTailProbe(props) {
  const [artifact, setArtifact] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const turn = props && props.turn ? props.turn : null;
  const turnStart = turn && turn.start ? Number(turn.start.time) || 0 : 0;
  const turnEnd = turn && turn.end ? Number(turn.end.time) || 0 : Date.now();
  useEffect(() => {
    if (turnStart <= 0 || turnEnd <= 0) return void 0;
    let alive = true;
    let objectUrl = null;
    (async () => {
      const decision = { step: "turntail-window", turnStart, turnEnd, createdAt: null, shown: false };
      try {
        const latest = await postJson({ action: "latest" });
        if (!alive || !latest || latest.ok !== true || !latest.artifact) {
          decision.reason = "no-artifact";
          await postJson({ action: "diag", ...decision });
          return;
        }
        const createdAt = Number(latest.artifact.createdAtMs);
        decision.createdAt = createdAt;
        if (!Number.isFinite(createdAt) || createdAt < turnStart || createdAt > turnEnd) {
          decision.reason = "outside-window";
          await postJson({ action: "diag", ...decision });
          return;
        }
        decision.shown = true;
        decision.reason = "shown";
        setArtifact(latest.artifact);
        const response = await fetch("/api/html-render/", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ action: "artifact", id: latest.artifact.id })
        });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setImgUrl(objectUrl);
      } catch {
      } finally {
        if (alive) await postJson({ action: "diag", ...decision }).catch(() => {
        });
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [turnStart, turnEnd]);
  if (!artifact) return null;
  return import_react2.default.createElement("div", { className: "dhr-tail-wrap" }, [
    import_react2.default.createElement("div", { className: "dhr-tail", key: "head" }, [
      import_react2.default.createElement("span", { className: "dhr-tail-dot", key: "dot" }),
      import_react2.default.createElement("span", { className: "dhr-tail-text", key: "text" }, "\u672C\u8F6E\u6E32\u67D3\u7ED3\u679C"),
      import_react2.default.createElement(
        "span",
        { className: "dhr-tail-sub", key: "sub" },
        `${artifact.id.split(".").pop().toUpperCase()}${imgUrl ? " \xB7 \u70B9\u51FB\u653E\u5927" : " \xB7 \u52A0\u8F7D\u4E2D"}`
      )
    ]),
    imgUrl ? import_react2.default.createElement("img", {
      className: zoomed ? "dhr-tail-image dhr-tail-image-zoom" : "dhr-tail-image",
      key: "image",
      src: imgUrl,
      alt: "html render result",
      onClick: () => setZoomed((value) => !value)
    }) : null
  ]);
}

// client/styles.js
var CSS = `
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

/* \u4F1A\u8BDD\u5185\u7684 html_render \u5DE5\u5177\u5361\u7247 */
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
.dhr-tv-body > summary::before { content: '\u25B8 '; }
.dhr-tv-body[open] > summary::before { content: '\u25BE '; }

/* html \u56F4\u680F\u6E32\u67D3\u6210\u6C99\u7BB1 iframe\uFF08\u6CE8\u610F\uFF1A\u672C\u6587\u4EF6\u662F\u6A21\u677F\u5B57\u7B26\u4E32\uFF0C\u6CE8\u91CA\u91CC\u4E0D\u8981\u51FA\u73B0\u53CD\u5F15\u53F7\uFF09 */
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

/* \u4F1A\u8BDD turn \u5C3E\u90E8\u7684\u6E32\u67D3\u7ED3\u679C\u5361\u7247 */
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
/* \u70B9\u51FB\u653E\u5927\uFF1A\u8D34\u6EE1\u89C6\u53E3\uFF0C\u518D\u70B9\u4E00\u6B21\u8FD8\u539F\uFF08\u4E0D\u4F9D\u8D56\u65B0\u6807\u7B7E\u9875\u4E0E blob \u751F\u547D\u5468\u671F\uFF09 */
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
function insertStyles(id, css) {
  const element = document.createElement("style");
  element.dataset.plugin = id;
  element.textContent = css;
  document.head.appendChild(element);
  return () => {
    if (element.parentNode) element.parentNode.removeChild(element);
  };
}

// client/index.js
var NS = "dsh-html-render";
var index_default = {
  inject: ["slots", "locale"],
  apply(ctx) {
    const locale = ctx.get("locale");
    try {
      fetch("/api/html-render/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "diag", step: "client-apply", ns: NS })
      }).catch(() => {
      });
    } catch {
    }
    if (locale) {
      ctx.effect(() => locale.register(NS, "zh", zh), "dsh-html-render: locale zh");
      ctx.effect(() => locale.register(NS, "en", en), "dsh-html-render: locale en");
    }
    ctx.effect(() => insertStyles(NS, CSS), "dsh-html-render: styles");
    ctx.slots.inject(
      "conversation.chat.markdown.fence",
      () => ctx.slots.register(
        {
          name: "conversation.chat.markdown.fence",
          key: "html",
          id: "dsh-html-render/fence/html",
          order: 10
        },
        HtmlFence
      )
    );
    ctx.slots.inject(
      "conversation.chat.turnTail",
      () => ctx.slots.register(
        { name: "conversation.chat.turnTail", id: "dsh-html-render-tail", order: 10 },
        TurnTailProbe
      )
    );
  }
};

return module.exports && module.exports.default ? module.exports.default : module.exports;
} });
