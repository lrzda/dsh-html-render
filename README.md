# dsh-html-render

把任意前端界面（HTML / CSS / JS）渲染出来 —— 在 DSH 面板里**交互预览**，一键导出 **PNG / JPG / PDF / SVG**，同时给 agent 一个能截回真实图片的 `html_render` 工具。

渲染引擎用**本机 Microsoft Edge**（无头 + DevTools Protocol），不下载 Chromium。

## 状态

已实现并在本机 DSH 跑通（M1–M4）。分层设计与接口契约见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 怎么用

**面板**：DSH 侧边栏「HTML 渲染」→ 左侧写 HTML（或「从文件载入」）→「应用到预览」→ 右侧 iframe 实时渲染、可交互 → 右上「导出 ▾」选 PNG / JPG / PDF / SVG → 产物出现在下方列表，可打开所在目录或删除。

> 导出抓的是**此刻 iframe 的 DOM 快照**，所以你在预览里点了 tab、填了表单，导出的就是那个状态。

**给 agent**：`html_render` 工具

```jsonc
{
  "source": { "kind": "html", "content": "<h1>hi</h1>" },
  "format": "png",
  "viewport": { "width": 1280, "height": 800, "deviceScaleFactor": 2 },
  "options": { "fullPage": true },
  "actions": [{ "type": "click", "selector": "#tab2" }]
}
```
返回产物绝对路径，随后可直接用图片读取器查看渲染结果。

**产物目录**：`%DSH_HOME%\html-render\artifacts\`（默认 `C:\Users\<你>\.dsh\html-render\artifacts`），最多保留 200 个，超出按时间裁掉最旧的。


## 分层一览

```
adapters（面板 HTTP / agent 工具）
      ↓
service（编排、产物落盘）
      ↓
render（一次渲染会话、就绪判定）
      ↓
edge（进程、CDP）   exporters（png/jpeg/pdf/svg）
```

依赖只向下，新增导出格式只需在 `lib/host/exporters/` 加一个文件并在注册表登记一行。

## 开发

```bash
npm install          # 只为 client 打包准备 esbuild
npm run build        # client/ → lib/client.js（host 侧无需构建）
npm test             # 单元测试
npm run smoke        # 真启 Edge，跑通一次 PNG
```

## 许可

MIT
