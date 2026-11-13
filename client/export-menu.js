/**
 * 导出下拉菜单。
 *
 * 格式清单不硬编码：从 host 的 `/formats` 拿，所以将来加格式时
 * 这里一行都不用改（服务端注册表是什么，这里就显示什么）。
 *
 * 用工厂注入 React，而不是直接 import：让这个文件对 React 的版本/来源零假设。
 */
export function createExportMenu(React) {
  const { useState, useEffect, useRef, useCallback } = React;
  const h = React.createElement;

  return function ExportMenu({ formats, busy, onExport, t }) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // 点空白处收起
    useEffect(() => {
      if (!open) return undefined;
      const onDocDown = (event) => {
        if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', onDocDown);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onDocDown);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);

    const choose = useCallback(
      (format) => {
        setOpen(false);
        onExport(format);
      },
      [onExport],
    );

    return h(
      'div',
      { className: 'dhr-menu', ref: wrapRef },
      h(
        'button',
        {
          type: 'button',
          className: 'dhr-btn dhr-btn-primary',
          disabled: busy,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          onClick: () => setOpen((value) => !value),
        },
        busy ? t('exporting') : `${t('export')} ▾`,
      ),
      open
        ? h(
            'div',
            { className: 'dhr-menu-pop', role: 'menu' },
            formats.map((item) =>
              h(
                'button',
                {
                  key: item.format,
                  type: 'button',
                  role: 'menuitem',
                  className: 'dhr-menu-item',
                  onClick: () => choose(item.format),
                },
                h('span', null, item.format.toUpperCase()),
                h('small', null, item.extension),
              ),
            ),
          )
        : null,
    );
  };
}
