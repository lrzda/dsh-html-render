/**
 * 客户端入口：只做 slot 注册和依赖装配。
 *
 * DSH 会把这里的返回值当作插件对象使用（`inject` 声明依赖、`apply` 执行注册）。
 * 构建脚本会把这个模块的默认导出原样交给 `window.__ModuleLoader__`。
 */
import React from 'react';

import { api } from './host-api.js';
import { createExportMenu } from './export-menu.js';
import { createPanel } from './panel.js';
import { createPreview, snapshotFrame } from './preview.js';
import { CSS, insertStyles } from './styles.js';
import { en, zh } from './i18n.js';

const NS = 'dsh-html-render';
const PANEL_ID = 'dsh-html-render';

// 依赖注入：把 React 和跨模块能力交给各组件，组件自己不 import 别的东西
const Preview = createPreview(React);
const ExportMenu = createExportMenu(React);
const Panel = createPanel(React, { Preview, ExportMenu, api, snapshotFrame });

/** 侧边栏图标：一个带尖括号的画框。 */
function PanelIcon({ size }) {
  const px = typeof size === 'number' ? size : 16;
  return React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: px,
      height: px,
      'aria-hidden': true,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    React.createElement('rect', { x: 3, y: 4, width: 18, height: 16, rx: 3 }),
    React.createElement('path', { d: 'M8.5 9.5 6 12l2.5 2.5' }),
    React.createElement('path', { d: 'M15.5 9.5 18 12l-2.5 2.5' }),
  );
}

export default {
  inject: ['slots', 'locale'],

  apply(ctx) {
    const locale = ctx.get('locale');

    if (locale) {
      ctx.effect(() => locale.register(NS, 'zh', zh), 'dsh-html-render: locale zh');
      ctx.effect(() => locale.register(NS, 'en', en), 'dsh-html-render: locale en');
    }

    ctx.effect(() => insertStyles(NS, CSS), 'dsh-html-render: styles');

    const label = () => {
      if (!locale) return 'HTML Render';
      const bound = locale.bind(NS);
      const value = typeof bound === 'function' ? bound('open') : undefined;
      return typeof value === 'string' ? value : 'HTML Render';
    };

    // 侧边栏入口
    ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register(
        { name: 'sidebar.panellist', id: PANEL_ID, order: 60, label },
        (props) => React.createElement(PanelIcon, { size: props && props.size }),
      ),
    );

    // 主面板：点侧边栏图标后显示的就是它
    ctx.slots.inject('main', () =>
      ctx.slots.register({ name: 'main', key: PANEL_ID }, () =>
        React.createElement(Panel, { locale }),
      ),
    );
  },
};
