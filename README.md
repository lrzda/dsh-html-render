# dsh-html-render

在 DeepSeek Harness 的**会话里随时预览前端页面**：写一个 ` ```html ` 代码块，它就在原地渲染成沙箱 iframe；需要图片/PDF 时，`html_render` 工具会用本机 Edge 无头渲染并导出。

> 定位说明：早期版本带一个右侧 HTML 工作台（贴代码 → 预览 → 导出）。实际使用后确认那是个没必要的中间层 —— 真正要的是"**写出来的页面直接出现在对话里**"。工作台已移除，相关源码保留在 `client/` 下但不再打包。

---

## 能力

| 能力 | 说明 |
|---|---|
| **会话内预览** | `conversation.chat.markdown.fence`（key: `html`）把代码块渲染成沙箱 iframe，位置由写在哪里决定，一次回答可以有多个 |
| **交互保留** | iframe 内 JS / CSS / 表单 / 动画全部真实运行，`sandbox` 允许脚本但不给 `allow-same-origin`（页面碰不到宿主 DOM） |
| **流式安全** | 流式输出期间原样交还宿主代码块（半截 HTML 不该被渲染），输出完成后才接管 |
| **源码可查** | 渲染结果下面保留「查看源码」折叠，想看原始代码随时展开 |
| **离线导出** | `html_render` 工具用本机 Edge + CDP 导出 PNG / JPG / PDF / SVG，产物落在 `%DSH_HOME%\html-render\artifacts` |
| **导出结果回显** | 某轮通过工具产出过图片时，该轮末尾补一张结果图（按轮次时间窗判断，不会污染其他会话） |

## 用法

**在对话里预览** —— 直接写围栏，语言名 `html`：

````
```html
<h1>Hello</h1>
```
````

**导出成文件** —— 调用 `html_render` 工具：

```jsonc
{
  "source": { "kind": "html", "content": "<h1>hi</h1>" },
  "format": "png",                                  // png | jpeg | pdf | svg
  "viewport": { "width": 1280, "height": 800, "deviceScaleFactor": 2 },
  "options": { "fullPage": true },
  "actions": [{ "type": "click", "selector": "#tab2" }]   // 可选：先交互再截图
}
```

返回产物路径与尺寸；PNG/JPG/SVG 可在该轮末尾直接回显。

## 架构

```
adapters（HTTP 路由 / agent 工具）
      ↓
service（编排、产物落盘）
      ↓
render（一次渲染会话、就绪判定）
      ↓
edge（进程、CDP）   exporters（png/jpeg/pdf/svg）
```

- host 侧是原生 Node ESM 多文件，无需构建；
- client 侧用 esbuild 打成 lazy-CJS factory（`window.__ModuleLoader__.load`），React 等宿主共享模块保持 external；
- 会话渲染走官方 slot：`conversation.chat.markdown.fence`（核心）与 `conversation.chat.turnTail`（导出结果回显）。

细节与踩坑记录见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 开发

```bash
npm install            # 仅为 client 打包准备 esbuild
node build.mjs         # client/ → lib/client.js（host 侧无需构建）
node test/client.bundle.check.mjs   # 校验 bundle 能被宿主加载、slot 注册正确
node test/locator.test.mjs
node test/service.test.mjs
```

> Windows 上 `npm install` 与 `node build.mjs` 需要在完全权限下运行（npm 要写缓存目录、esbuild 要起子进程）。改完 client 代码后必须**重启 DSH** 才会生效（Electron 窗口里 Ctrl+F5 无效）。

## 许可

MIT
