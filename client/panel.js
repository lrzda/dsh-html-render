/**
 * 面板主体：编辑区 + 预览区 + 产物列表。
 *
 * 组件本身不碰网络 —— 所有请求都通过注入进来的 `api`；也不碰 iframe 细节，
 * 那是 `preview.js` 的事。于是这个文件只表达"界面怎么排、状态怎么流动"。
 */
export function createPanel(React, deps) {
  const { useState, useEffect, useRef, useCallback } = React;
  const h = React.createElement;
  const { Preview, ExportMenu, api, snapshotFrame } = deps;

  const DEFAULT_HTML =
    '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<style>\n' +
    '  body { margin: 0; min-height: 100vh; display: grid; place-items: center;\n' +
    '         font-family: "Microsoft YaHei", sans-serif; background: linear-gradient(135deg,#0f172a,#312e81); }\n' +
    '  h1 { color: #fff; font-size: 34px; letter-spacing: .02em; }\n' +
    '  p  { color: #93c5fd; }\n' +
    '</style>\n</head>\n<body>\n  <div>\n    <h1>Hello, 姐姐</h1>\n    <p>在这里写你的界面，右边实时预览。</p>\n  </div>\n</body>\n</html>';

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  };

  return function Panel({ locale }) {
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
        const dict = locale ? locale.bind('dsh-html-render') : null;
        const value = dict ? dict(key) : undefined;
        return typeof value === 'string' ? value : key;
      },
      [locale],
    );

    const refreshList = useCallback(async () => {
      try {
        const data = await api.list(20);
        setArtifacts(Array.isArray(data.artifacts) ? data.artifacts : []);
      } catch (error) {
        setNotice({ kind: 'error', text: `${t('listFailed')}: ${error.message}` });
      }
    }, [t]);

    useEffect(() => {
      let alive = true;
      (async () => {
        try {
          const data = await api.formats();
          if (alive) setFormats(Array.isArray(data.formats) ? data.formats : []);
        } catch (error) {
          if (alive) setNotice({ kind: 'error', text: error.message });
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
        const text = String(reader.result ?? '');
        setSourceText(text);
        setPreviewHtml(text);
        setNotice({ kind: 'ok', text: `${file.name}` });
      };
      reader.onerror = () => setNotice({ kind: 'error', text: String(reader.error?.message ?? 'read failed') });
      reader.readAsText(file);
      event.target.value = '';
    }, []);

    const doExport = useCallback(
      async (format) => {
        setBusy(true);
        setNotice(null);
        try {
          // 抓"此刻"的 DOM 快照：交互后的状态才是用户想导出的东西
          const snapshot = snapshotFrame(frameRef.current) || sourceText;
          const result = await api.exportArtifact({
            source: { kind: 'html', content: snapshot },
            format,
            viewport: { width: 1280, height: 800, deviceScaleFactor: Number(scale) || 1 },
            options: { fullPage },
          });
          setNotice({
            kind: 'ok',
            text: `${t('exportingDone')} ${format.toUpperCase()} ${result.width}×${result.height} · ${formatBytes(result.bytes)}`,
          });
          await refreshList();
        } catch (error) {
          setNotice({ kind: 'error', text: `${t('exportFailed')}: ${error.message}` });
        } finally {
          setBusy(false);
        }
      },
      [fullPage, refreshList, scale, sourceText, t],
    );

    const openArtifact = useCallback(async (id) => {
      try {
        await api.open(id);
      } catch (error) {
        setNotice({ kind: 'error', text: error.message });
      }
    }, []);

    const removeArtifact = useCallback(
      async (id) => {
        try {
          await api.remove(id);
          await refreshList();
        } catch (error) {
          setNotice({ kind: 'error', text: error.message });
        }
      },
      [refreshList],
    );

    return h(
      'div',
      { className: 'dhr-panel' },
      h(
        'header',
        { className: 'dhr-header' },
        h('span', { className: 'dhr-title' }, t('title')),
        h('span', { className: 'dhr-subtitle' }, t('subtitle')),
      ),

      h(
        'div',
        { className: 'dhr-toolbar' },
        h('label', { className: 'dhr-field' }, [
          h('input', {
            key: 'full',
            type: 'checkbox',
            checked: fullPage,
            onChange: (event) => setFullPage(event.target.checked),
          }),
          h('span', { key: 'full-label', className: 'dhr-label' }, t('fullPage')),
        ]),
        h('label', { className: 'dhr-field' }, [
          h('span', { key: 'scale-label', className: 'dhr-label' }, t('scale')),
          h('input', {
            key: 'scale',
            className: 'dhr-input-number',
            type: 'number',
            min: 1,
            max: 4,
            step: 1,
            value: scale,
            onChange: (event) => setScale(Number(event.target.value) || 1),
          }),
        ]),
        h('span', { className: 'dhr-spacer' }),
        h(
          'button',
          { type: 'button', className: 'dhr-btn', onClick: applySource },
          t('apply'),
        ),
        h(ExportMenu, {
          formats: formats.length > 0 ? formats : [{ format: 'png', extension: '.png' }],
          busy,
          onExport: doExport,
          t,
        }),
      ),

      notice
        ? h('div', { className: `dhr-notice dhr-notice-${notice.kind}` }, notice.text)
        : null,

      h(
        'div',
        { className: 'dhr-body' },
        h(
          'section',
          { className: 'dhr-col' },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('span', { className: 'dhr-col-title', style: { flex: 1 } }, t('source')),
            h(
              'label',
              { className: 'dhr-btn', style: { height: '26px', lineHeight: '24px', fontSize: '12px', cursor: 'pointer' } },
              t('loadFile'),
              h('input', { type: 'file', accept: '.html,.htm,text/html', onChange: onFile, style: { display: 'none' } }),
            ),
          ),
          h('textarea', {
            className: 'dhr-textarea',
            spellCheck: false,
            value: sourceText,
            onChange: (event) => setSourceText(event.target.value),
            placeholder: t('placeholder'),
          }),
          h('div', { className: 'dhr-hint' }, t('sourceHint')),
        ),

        h(
          'section',
          { className: 'dhr-col' },
          h('span', { className: 'dhr-col-title' }, `${t('artifacts')} (${artifacts.length})`),
          h(Preview, { html: previewHtml, frameRef, emptyHint: t('previewEmpty') }),
          artifacts.length === 0
            ? h('div', { className: 'dhr-hint' }, t('artifactsEmpty'))
            : h(
                'ul',
                { className: 'dhr-list' },
                artifacts.map((item) =>
                  h(
                    'li',
                    { key: item.id, className: 'dhr-item' },
                    h('div', { className: 'dhr-item-main' }, [
                      h('span', { key: 'name', className: 'dhr-item-name' }, item.id),
                      h(
                        'span',
                        { key: 'meta', className: 'dhr-item-meta' },
                        `${formatBytes(item.bytes)} · ${new Date(item.createdAt).toLocaleTimeString()}`,
                      ),
                    ]),
                    h(
                      'div',
                      { className: 'dhr-item-actions' },
                      h(
                        'button',
                        { type: 'button', className: 'dhr-btn', title: t('openArtifact'), onClick: () => openArtifact(item.id) },
                        '↗',
                      ),
                      h(
                        'button',
                        { type: 'button', className: 'dhr-btn', title: t('removeArtifact'), onClick: () => removeArtifact(item.id) },
                        '×',
                      ),
                    ),
                  ),
                ),
              ),
        ),
      ),
    );
  };
}
