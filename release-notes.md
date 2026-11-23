## 主要变化

- **会话内预览**：注册 `conversation.chat.markdown.fence`（key: `html`）。写一个 `html` 代码块，它会被就地渲染成沙箱 iframe —— 位置由写在哪里决定，一次回答可以出现多个，页面里的 JS/CSS/表单全部真实运行。
- **移除右侧工作台**：`sidebar.panellist` / `main` 已注销（源码保留但不再打包），客户端 bundle 从 34 KB 降到 20 KB。插件的定位从"贴代码再导出的工具台"变成"会话里的渲染能力"。
- **导出结果回显**：`html_render` 工具产出图片时，该轮末尾会补一张结果图，按轮次时间窗判断，不会污染其他会话。

## 修复

- `GET /api/html-render/artifact` 到不了插件路由（被前端静态资源处理截走，日志零记录），取图改走 POST + blob URL。
- `turnTail` 的时间判断写成了「产物时间 ≥ 本轮开始」，导致所有历史轮次都误显示；改为落在 `[turn.start, turn.end]` 窗口内。
- CSS 注释里的反引号截断模板字符串，导致构建失败。

## 安装

```sh
dsh plugin --profile desktop add https://github.com/lrzda/dsh-html-render/releases/download/v0.2.0/dsh-html-render-0.2.0.tgz
```

要求：Windows + 本机 Microsoft Edge（渲染引擎走 headless Edge + DevTools Protocol），DSH 0.2.2-rc.1 起验证。

## 已知边界

- 仅 Windows：路径与 Edge 定位按 Windows 布局构造。
- `tool.call.toolview` 对第三方插件在 0.2.2-rc.1 上不渲染返回值（组件被调用但不进 DOM），因此工具卡片走的是"轮次末尾回显"而非接管卡片。
- SVG 导出对普通网页是折中：页面主体是原生 `<svg>` 时导出真矢量，否则用 `foreignObject` 包装，部分工具（Illustrator 等）可能不认。
