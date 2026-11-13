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
var import_react = __toESM(require("react"), 1);

// client/host-api.js
var ROUTE = "/api/html-render/";
async function call(action, payload = {}) {
  let response;
  try {
    response = await fetch(ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload })
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
    throw new Error(data && data.error || `HTTP ${response.status}`);
  }
  return data;
}
var api = {
  /** @returns {Promise<{formats: Array<{format: string, mime: string, extension: string}>}>} */
  formats: () => call("formats"),
  /**
   * 导出一份 HTML。
   * @param {{source: object, format: string, viewport?: object, options?: object}} request
   */
  exportArtifact: (request) => call("export", request),
  /** @param {number} [limit] */
  list: (limit) => call("list", { limit }),
  /** @param {string} id */
  open: (id) => call("open", { id }),
  /** @param {string} id */
  remove: (id) => call("delete", { id })
};

// client/export-menu.js
function createExportMenu(React2) {
  const { useState, useEffect, useRef, useCallback } = React2;
  const h = React2.createElement;
  return function ExportMenu2({ formats, busy, onExport, t }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    useEffect(() => {
      if (!open) return void 0;
      const onDocDown = (event) => {
        if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
      };
      const onKey = (event) => {
        if (event.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onDocDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDocDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);
    const choose = useCallback(
      (format) => {
        setOpen(false);
        onExport(format);
      },
      [onExport]
    );
    return h(
      "div",
      { className: "dhr-menu", ref: wrapRef },
      h(
        "button",
        {
          type: "button",
          className: "dhr-btn dhr-btn-primary",
          disabled: busy,
          "aria-haspopup": "menu",
          "aria-expanded": open,
          onClick: () => setOpen((value) => !value)
        },
        busy ? t("exporting") : `${t("export")} \u25BE`
      ),
      open ? h(
        "div",
        { className: "dhr-menu-pop", role: "menu" },
        formats.map(
          (item) => h(
            "button",
            {
              key: item.format,
              type: "button",
              role: "menuitem",
              className: "dhr-menu-item",
              onClick: () => choose(item.format)
            },
            h("span", null, item.format.toUpperCase()),
            h("small", null, item.extension)
          )
        )
      ) : null
    );
  };
}

// client/panel.js
function createPanel(React2, deps) {
  const { useState, useEffect, useRef, useCallback } = React2;
  const h = React2.createElement;
  const { Preview: Preview2, ExportMenu: ExportMenu2, api: api2, snapshotFrame: snapshotFrame2 } = deps;
  const DEFAULT_HTML = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<style>\n  body { margin: 0; min-height: 100vh; display: grid; place-items: center;\n         font-family: "Microsoft YaHei", sans-serif; background: linear-gradient(135deg,#0f172a,#312e81); }\n  h1 { color: #fff; font-size: 34px; letter-spacing: .02em; }\n  p  { color: #93c5fd; }\n</style>\n</head>\n<body>\n  <div>\n    <h1>Hello, \u59D0\u59D0</h1>\n    <p>\u5728\u8FD9\u91CC\u5199\u4F60\u7684\u754C\u9762\uFF0C\u53F3\u8FB9\u5B9E\u65F6\u9884\u89C8\u3002</p>\n  </div>\n</body>\n</html>';
  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  };
  return function Panel2({ locale }) {
    const [sourceText, setSourceText] = useState(DEFAULT_HTML);
    const [previewHtml, setPreviewHtml] = useState(DEFAULT_HTML);
    const [formats, setFormats] = useState([]);
    const [artifacts, setArtifacts] = useState([]);
    const [fullPage, setFullPage] = useState(true);
    const [scale, setScale] = useState(2);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const frameRef = useRef(null);
    const t = useCallback(
      (key) => {
        const dict = locale ? locale.bind("dsh-html-render") : null;
        const value = dict ? dict(key) : void 0;
        return typeof value === "string" ? value : key;
      },
      [locale]
    );
    const refreshList = useCallback(async () => {
      try {
        const data = await api2.list(20);
        setArtifacts(Array.isArray(data.artifacts) ? data.artifacts : []);
      } catch (error) {
        setNotice({ kind: "error", text: `${t("listFailed")}: ${error.message}` });
      }
    }, [t]);
    useEffect(() => {
      let alive = true;
      (async () => {
        try {
          const data = await api2.formats();
          if (alive) setFormats(Array.isArray(data.formats) ? data.formats : []);
        } catch (error) {
          if (alive) setNotice({ kind: "error", text: error.message });
        }
        if (alive) await refreshList();
      })();
      return () => {
        alive = false;
      };
    }, [refreshList]);
    const applySource = useCallback(() => {
      setPreviewHtml(sourceText);
      setNotice(null);
    }, [sourceText]);
    const onFile = useCallback((event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        setSourceText(text);
        setPreviewHtml(text);
        setNotice({ kind: "ok", text: `${file.name}` });
      };
      reader.onerror = () => setNotice({ kind: "error", text: String(reader.error?.message ?? "read failed") });
      reader.readAsText(file);
      event.target.value = "";
    }, []);
    const doExport = useCallback(
      async (format) => {
        setBusy(true);
        setNotice(null);
        try {
          const snapshot = snapshotFrame2(frameRef.current) || sourceText;
          const result = await api2.exportArtifact({
            source: { kind: "html", content: snapshot },
            format,
            viewport: { width: 1280, height: 800, deviceScaleFactor: Number(scale) || 1 },
            options: { fullPage }
          });
          setNotice({
            kind: "ok",
            text: `${t("exportingDone")} ${format.toUpperCase()} ${result.width}\xD7${result.height} \xB7 ${formatBytes(result.bytes)}`
          });
          await refreshList();
        } catch (error) {
          setNotice({ kind: "error", text: `${t("exportFailed")}: ${error.message}` });
        } finally {
          setBusy(false);
        }
      },
      [fullPage, refreshList, scale, sourceText, t]
    );
    const openArtifact = useCallback(async (id) => {
      try {
        await api2.open(id);
      } catch (error) {
        setNotice({ kind: "error", text: error.message });
      }
    }, []);
    const removeArtifact = useCallback(
      async (id) => {
        try {
          await api2.remove(id);
          await refreshList();
        } catch (error) {
          setNotice({ kind: "error", text: error.message });
        }
      },
      [refreshList]
    );
    return h(
      "div",
      { className: "dhr-panel" },
      h(
        "header",
        { className: "dhr-header" },
        h("span", { className: "dhr-title" }, t("title")),
        h("span", { className: "dhr-subtitle" }, t("subtitle"))
      ),
      h(
        "div",
        { className: "dhr-toolbar" },
        h("label", { className: "dhr-field" }, [
          h("input", {
            key: "full",
            type: "checkbox",
            checked: fullPage,
            onChange: (event) => setFullPage(event.target.checked)
          }),
          h("span", { key: "full-label", className: "dhr-label" }, t("fullPage"))
        ]),
        h("label", { className: "dhr-field" }, [
          h("span", { key: "scale-label", className: "dhr-label" }, t("scale")),
          h("input", {
            key: "scale",
            className: "dhr-input-number",
            type: "number",
            min: 1,
            max: 4,
            step: 1,
            value: scale,
            onChange: (event) => setScale(Number(event.target.value) || 1)
          })
        ]),
        h("span", { className: "dhr-spacer" }),
        h(
          "button",
          { type: "button", className: "dhr-btn", onClick: applySource },
          t("apply")
        ),
        h(ExportMenu2, {
          formats: formats.length > 0 ? formats : [{ format: "png", extension: ".png" }],
          busy,
          onExport: doExport,
          t
        })
      ),
      notice ? h("div", { className: `dhr-notice dhr-notice-${notice.kind}` }, notice.text) : null,
      h(
        "div",
        { className: "dhr-body" },
        h(
          "section",
          { className: "dhr-col" },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px" } },
            h("span", { className: "dhr-col-title", style: { flex: 1 } }, t("source")),
            h(
              "label",
              { className: "dhr-btn", style: { height: "26px", lineHeight: "24px", fontSize: "12px", cursor: "pointer" } },
              t("loadFile"),
              h("input", { type: "file", accept: ".html,.htm,text/html", onChange: onFile, style: { display: "none" } })
            )
          ),
          h("textarea", {
            className: "dhr-textarea",
            spellCheck: false,
            value: sourceText,
            onChange: (event) => setSourceText(event.target.value),
            placeholder: t("placeholder")
          }),
          h("div", { className: "dhr-hint" }, t("sourceHint"))
        ),
        h(
          "section",
          { className: "dhr-col" },
          h("span", { className: "dhr-col-title" }, `${t("artifacts")} (${artifacts.length})`),
          h(Preview2, { html: previewHtml, frameRef, emptyHint: t("previewEmpty") }),
          artifacts.length === 0 ? h("div", { className: "dhr-hint" }, t("artifactsEmpty")) : h(
            "ul",
            { className: "dhr-list" },
            artifacts.map(
              (item) => h(
                "li",
                { key: item.id, className: "dhr-item" },
                h("div", { className: "dhr-item-main" }, [
                  h("span", { key: "name", className: "dhr-item-name" }, item.id),
                  h(
                    "span",
                    { key: "meta", className: "dhr-item-meta" },
                    `${formatBytes(item.bytes)} \xB7 ${new Date(item.createdAt).toLocaleTimeString()}`
                  )
                ]),
                h(
                  "div",
                  { className: "dhr-item-actions" },
                  h(
                    "button",
                    { type: "button", className: "dhr-btn", title: t("openArtifact"), onClick: () => openArtifact(item.id) },
                    "\u2197"
                  ),
                  h(
                    "button",
                    { type: "button", className: "dhr-btn", title: t("removeArtifact"), onClick: () => removeArtifact(item.id) },
                    "\xD7"
                  )
                )
              )
            )
          )
        )
      )
    );
  };
}

// client/preview.js
function createPreview(React2) {
  const h = React2.createElement;
  return function Preview2({ html, frameRef, emptyHint }) {
    if (!html) {
      return h("div", { className: "dhr-preview-empty" }, emptyHint);
    }
    return h("div", { className: "dhr-preview-shell" }, [
      h("iframe", {
        key: "frame",
        ref: frameRef,
        className: "dhr-preview-frame",
        title: "html-preview",
        sandbox: "allow-scripts allow-same-origin allow-forms allow-modals allow-popups",
        srcDoc: html
      })
    ]);
  };
}
function snapshotFrame(frame) {
  const doc = frame?.contentDocument;
  if (!doc || !doc.documentElement) return "";
  const html = doc.documentElement.outerHTML;
  return html.startsWith("<!") ? html : `<!doctype html>
${html}`;
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

// client/index.js
var NS = "dsh-html-render";
var PANEL_ID = "dsh-html-render";
var Preview = createPreview(import_react.default);
var ExportMenu = createExportMenu(import_react.default);
var Panel = createPanel(import_react.default, { Preview, ExportMenu, api, snapshotFrame });
function PanelIcon({ size }) {
  const px = typeof size === "number" ? size : 16;
  return import_react.default.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: px,
      height: px,
      "aria-hidden": true,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.7,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    import_react.default.createElement("rect", { x: 3, y: 4, width: 18, height: 16, rx: 3 }),
    import_react.default.createElement("path", { d: "M8.5 9.5 6 12l2.5 2.5" }),
    import_react.default.createElement("path", { d: "M15.5 9.5 18 12l-2.5 2.5" })
  );
}
var index_default = {
  inject: ["slots", "locale"],
  apply(ctx) {
    const locale = ctx.get("locale");
    if (locale) {
      ctx.effect(() => locale.register(NS, "zh", zh), "dsh-html-render: locale zh");
      ctx.effect(() => locale.register(NS, "en", en), "dsh-html-render: locale en");
    }
    ctx.effect(() => insertStyles(NS, CSS), "dsh-html-render: styles");
    const label = () => {
      if (!locale) return "HTML Render";
      const bound = locale.bind(NS);
      const value = typeof bound === "function" ? bound("open") : void 0;
      return typeof value === "string" ? value : "HTML Render";
    };
    ctx.slots.inject(
      "sidebar.panellist",
      () => ctx.slots.register(
        { name: "sidebar.panellist", id: PANEL_ID, order: 60, label },
        (props) => import_react.default.createElement(PanelIcon, { size: props && props.size })
      )
    );
    ctx.slots.inject(
      "main",
      () => ctx.slots.register(
        { name: "main", key: PANEL_ID },
        () => import_react.default.createElement(Panel, { locale })
      )
    );
  }
};

return module.exports && module.exports.default ? module.exports.default : module.exports;
} });
