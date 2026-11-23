/**
 * 客户端入口：只保留"会话内渲染"这一件事。
 *
 * 定位变更（2026-11-23 用户确认）：
 *   右侧的 HTML 工作台（sidebar.panellist + main）已移除 —— 它的用处是把 HTML 贴进面板再导出，
 *   而真正需要的能力是"在会话里随时预览"，也就是 markdown 代码块级渲染。
 *
 * 现在只注册两处，都在会话里：
 *   1. `conversation.chat.markdown.fence`（key: html）—— 把 ```html 围栏渲染成沙箱 iframe，
 *      位置由写在哪里决定，可以出现任意多次，这才是"随时预览"；
 *   2. `conversation.chat.turnTail` —— 当某一轮通过 html_render 工具产出过图片时，
 *      在该轮末尾补一张结果图（例如导出的 PNG/PDF 预览）。
 *
 * 面板相关的源码（panel/preview/export-menu/host-api）仍留在 client/ 目录里，
 * 只是不再被打包导入，需要时可以随时接回来。
 */
import { en, zh } from './i18n.js';
import { HtmlFence } from './fence.js';
import { TurnTailProbe } from './turn-tail.js';
import { CSS, insertStyles } from './styles.js';

const NS = 'dsh-html-render';

export default {
  inject: ['slots', 'locale'],

  apply(ctx) {
    const locale = ctx.get('locale');

    // 自诊断：确认这个 client bundle 真的被加载并执行到了 apply。
    try {
      fetch('/api/html-render/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'diag', step: 'client-apply', ns: NS }),
      }).catch(() => {});
    } catch {
      /* 诊断失败不影响功能 */
    }

    if (locale) {
      ctx.effect(() => locale.register(NS, 'zh', zh), 'dsh-html-render: locale zh');
      ctx.effect(() => locale.register(NS, 'en', en), 'dsh-html-render: locale en');
    }

    ctx.effect(() => insertStyles(NS, CSS), 'dsh-html-render: styles');

    // 核心：markdown 代码块级渲染。```html 围栏 → 沙箱 iframe，就地预览。
    ctx.slots.inject('conversation.chat.markdown.fence', () =>
      ctx.slots.register(
        {
          name: 'conversation.chat.markdown.fence',
          key: 'html',
          id: 'dsh-html-render/fence/html',
          order: 10,
        },
        HtmlFence,
      ),
    );

    // 辅助：某一轮通过 html_render 工具产出过图片时，在轮次末尾补一张结果图。
    // 判据是"产物时间落在该轮时间窗内"，不会污染其它轮次或会话。
    ctx.slots.inject('conversation.chat.turnTail', () =>
      ctx.slots.register(
        { name: 'conversation.chat.turnTail', id: 'dsh-html-render-tail', order: 10 },
        TurnTailProbe,
      ),
    );
  },
};
