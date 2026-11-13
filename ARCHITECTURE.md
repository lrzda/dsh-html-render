# dsh-html-render · 架构设计

> 一个 DSH 插件：把任意前端界面（HTML/CSS/JS）渲染出来 —— 你自己在 DSH 里交互预览，我在 agent 侧拿到真实截图，想导出时一键出 PNG / JPG / PDF / SVG。

---

## 1. 目标与边界

| 项 | 内容 |
|---|---|
| **双使用者** | 面板（人）+ agent 工具（我），两者调用**同一套服务**，逻辑只写一遍 |
| **渲染引擎** | 本机 Microsoft Edge（无头 Chrome DevTools Protocol） |
| **预览** | 面板内真 iframe，**可交互**（点击、输入、动画、CSS 状态都能跑起来） |
| **导出** | PNG / JPG / PDF / SVG，由面板下拉菜单选，或由 agent 指定 |
| **非目标** | 不做通用浏览器自动化（点击任意网站、抓取），不代理网络，不内置 Chromium |

---

## 2. 解耦策略：四层，依赖单向

```
┌──────────────────────────────────────────────────────┐
│  L4 适配层  adapters/                                │
│     http-route.js（面板）   agent-tool.js（agent）    │
└───────────────────────┬──────────────────────────────┘
                        │ 只依赖 L3 的公开方法
┌───────────────────────▼──────────────────────────────┐
│  L3 服务层  service/                                 │
│     render-service.js（编排：输入→渲染→导出→落盘）    │
│     artifacts.js（产物目录、命名、清理）              │
└───────────────────────┬──────────────────────────────┘
                        │ 只依赖 L2 的接口
┌───────────────────────▼──────────────────────────────┐
│  L2 渲染层  render/                                  │
│     session.js（一次渲染会话的生命周期）              │
│     waits.js（"页面真的画好了"的判定）                │
└───────────┬───────────────────────────┬──────────────┘
            │                           │
┌───────────▼──────────┐   ┌────────────▼─────────────┐
│ L1 引擎层  edge/     │   │ L1 导出器  exporters/     │
│  locator.js          │   │  registry.js + 每种格式    │
│  cdp.js              │   │  一个文件，统一接口         │
│  browser.js          │   └──────────────────────────┘
└──────────────────────┘
```

**规则（写代码时请守住）**

1. 依赖只能**向下**，不能反着引用；L1 不认识 L3。
2. L2 不认识"导出格式"的概念，它只提供"能发 CDP 命令的页面句柄"；格式是 L1 导出器的事。
3. L3 不认识 HTTP，也不认识 agent 工具参数；它只收结构化对象、吐结构化结果。
4. L4 只做**协议翻译**（校验入参、格式化输出），不允许写业务判断。
5. 新增一种导出格式 = 在 `exporters/` 加一个文件 + 在 `registry.js` 注册一行，**其它文件零改动**。

---

## 3. 模块清单

### L1 · 引擎层 `lib/host/edge/`

| 文件 | 职责 | 对外接口 |
|---|---|---|
| `locator.js` | 找到本机 Edge（注册表 → 常见路径 → PATH），纯函数无副作用 | `findEdge(): {path, version, source}` |
| `cdp.js` | 极简 CDP 客户端：WebSocket 上的 JSON-RPC（`send(method, params)`、事件订阅、超时） | `class CdpConnection` |
| `browser.js` | Edge 进程生命周期：启动（`--remote-debugging-port=0`）、读 DevTools 地址、建/关 target、空闲回收 | `class BrowserHost { start(), newPage(), close() }` |

### L1 · 导出器 `lib/host/exporters/`

每个导出器实现同一份契约，互不引用：

```js
export const exporter = {
  format: 'png',
  mime: 'image/png',
  extension: '.png',
  requires: ['screenshot'],            // 声明它需要页面哪种能力
  async run(page, options) -> Buffer   // page = L2 的会话句柄
};
```

| 文件 | 实现方式 | 说明 |
|---|---|---|
| `png.js` | `Page.captureScreenshot { format:'png', captureBeyondViewport }` | 支持整页 & 视口两种 |
| `jpeg.js` | `Page.captureScreenshot { format:'jpeg', quality }` | 质量可调 |
| `pdf.js` | `Page.printToPDF` | 纸张、边距、背景、整页 |
| `svg.js` | 优先提取页面内 `<svg>` 序列化；否则 `foreignObject` 包装 | 两条路都标注能力差异 |
| `registry.js` | `Map<format, exporter>`；`list()` 给 UI 用 | 唯一知道"有哪些格式"的地方 |

### L2 · 渲染层 `lib/host/render/`

| 文件 | 职责 |
|---|---|
| `session.js` | 打开一次页面：加载 HTML/文件/URL → 等就绪 → 执行可选动作序列 → 交出 `page` 句柄（截图/PDF/求值都走它）→ 关闭 |
| `waits.js` | 就绪判定策略：`load` 事件、`document.fonts.ready`、图片 `complete`、可选"动画静默 200ms" |

### L3 · 服务层 `lib/host/service/`

| 文件 | 职责 |
|---|---|
| `render-service.js` | 唯一的业务入口。收 `{ source, viewport, format, options, actions }` → 调 L2 渲染 → 调 L1 导出器 → 交给 artifacts 落盘 → 返回产物描述 |
| `artifacts.js` | 产物目录（`~/.dsh/html-render/`）、文件名生成、按 id 查找、过期清理、路径越界防护 |

### L4 · 适配层 `lib/host/adapters/`

| 文件 | 职责 |
|---|---|
| `http-route.js` | `POST /api/html-render/`：同源校验、体积上限、action 分派、错误 → 4xx |
| `agent-tool.js` | `html_render` 工具：JSON Schema、把结构化结果转成可读文本、`presentCall` 卡片 |

### Client 侧 `client/`（单文件打包为 `lib/client.js`）

| 文件 | 职责 |
|---|---|
| `index.js` | 入口：注册 slot（侧边栏 + main 面板 + settings 分区） |
| `panel.js` | 面板骨架：工具栏 / 预览区 / 产物列表 |
| `preview.js` | iframe 预览（sandbox + 交互 + **DOM 快照**能力） |
| `export-menu.js` | 导出下拉菜单（格式列表从 `GET /formats` 拿，不硬编码） |
| `host-api.js` | 对 host 的唯一出口（fetch 封装，错误归一化） |
| `styles.js` | 全部 CSS，只用 `--dsw-alias-*` 主题 token |
| `i18n.js` | 中英字典（跟随宿主 locale） |

> **构建**：client 源码是多文件 ESM，`build.mjs` 用 esbuild 打成单文件 `lib/client.js`（React 外置，由宿主的 `require` 注入）。host 侧是多文件原生 ESM，无需构建。

---

## 4. 三条数据流

### 4.1 预览（人在面板里交互）

```
面板输入/选择 HTML 源
   → preview.js 生成 iframe（srcdoc + sandbox="allow-scripts allow-same-origin allow-forms allow-modals"）
   → 浏览器原生渲染，交互全在 iframe 内发生
   → 不经过 host，零延迟
```

### 4.2 导出（含"交互后的状态"）

```
点导出 → 选格式
   → preview.js 抓 document.documentElement.outerHTML（这一刻的 DOM 快照）
   → POST /api/html-render/ { action:'export', source:{kind:'snapshot', html}, format }
   → render-service 用 Edge 无头渲染这份快照
   → exporter 产出 Buffer → artifacts 落盘
   → 返回 { file, bytes, width, height }，面板提供"打开/定位"按钮
```

**这是本插件的关键点**：导出的不是"原始 HTML"，而是"你此刻看到的页面状态"。点了 tab、填了表单、触发了 hover 样式，导出的图里都是真的。

### 4.3 agent 调用（我）

```
html_render({ source:{kind:'html', content:'<h1>…'}, format:'png', viewport:{width:1280,height:800} })
   → 同一条 render-service
   → 返回文本：文件路径 + 尺寸 + 字节数
   → 我用 read_image 读这个路径，就能看见自己写的页面
```

可选 `actions` 参数让 agent 也能模拟交互：`[{type:'click', selector:'#tab2'}, {type:'eval', script:'…'}]`。

---

## 5. 接口契约

### 5.1 HTTP（面板 → host）

统一入口 `POST /api/html-render/`，body ≤ 1 MB（快照场景可放宽到 4 MB）。

| action | 入参 | 返回 |
|---|---|---|
| `formats` | — | `[{format, mime, extension}]` |
| `export` | `source{kind,content/path/url}`, `viewport{width,height,dpr}`, `format`, `options{fullPage,quality,…}` | `{id,file,bytes,width,height,mime}` |
| `list` | `limit?` | `[{id,file,bytes,format,createdAt}]` |
| `open` | `id` | `{opened}`（资源管理器定位） |
| `delete` | `id` | `{deleted}` |

### 5.2 agent 工具 `html_render`

| 参数 | 类型 | 说明 |
|---|---|---|
| `source` | object | `{kind:'html'\|'file'\|'url', content/path/url}` |
| `format` | enum | `png` / `jpeg` / `pdf` / `svg` |
| `viewport` | object | `{width, height, deviceScaleFactor}`，默认 1280×800×2 |
| `fullPage` | boolean | 整页 vs 视口 |
| `actions` | array | 交互序列 `{type:'click'\|'type'\|'eval'\|'wait', …}` |
| `waitFor` | string | 额外等待的 CSS 选择器 |

### 5.3 会话句柄（L2 → L1 导出器）

```js
{
  cdp,                        // CdpConnection
  evaluate(expr) -> any,      // Runtime.evaluate 的薄封装
  screenshot({format, quality, fullPage}) -> Buffer,
  pdf(options) -> Buffer,
  metrics() -> {width, height, contentHeight},
  close()
}
```

导出器只认这个对象，不认 Edge、不认 CDP 细节 —— 将来换渲染引擎（比如换 Playwright）只需替换 L1，L2 以上全部不动。

---

## 6. 关键技术决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 引擎 | 本机 Edge + CDP | 不下载 Chromium（省几百 MB）；CDP 能力足够（截图/PDF/求值/交互） |
| 预览 | iframe 而非截图 | 截图是死的；iframe 才有真交互（JS、表单、动画） |
| 导出 | host 侧无头渲染 | 不打断你的窗口、不受 DSH 沙箱限制、能批量 |
| 交互态 | DOM 快照 | 唯一能让"导出"反映"你操作后"的办法，且不需要 CDP 复刻操作 |
| SVG | 优先提取原生 `<svg>` | 整页 HTML 转 SVG 只能靠 `foreignObject`，兼容性有限，诚实标注 |
| 构建 | host 免构建 / client esbuild | host 原生 ESM 即可；client 必须单文件，所以只给 client 上构建 |
| 并发 | 单个 Edge 进程 + 多 target | 启动一次 2–3 秒，复用才快；空闲 5 分钟自动退出 |

---

## 7. 安全边界

1. **同源校验**：路由只接受同源请求（照抄 DSH 插件的通行做法）。
2. **入参白名单**：`source.kind` 只允许三种；`format` 只允许注册表内的值；未知 action 直接 400。
3. **路径收口**：`source.kind==='file'` 只接受工作区或插件数据目录内的路径；`artifacts` 生成的文件名由服务端拼，调用方永远拿不到任意写路径。
4. **iframe 沙箱**：预览用 `sandbox` 属性限定能力，默认不给 `allow-top-navigation`、不给 `allow-modals`。
5. **执行边界**：`actions.eval` 只在页面上下文运行，拿不到 Node 能力；HTML 里的 `<script>` 同样跑在无头页面里，不接触宿主。
6. **体积上限**：HTML 字符串 ≤ 4 MB；截图长边 ≤ 16384 px。

---

## 8. 目录树

```
dsh-html-render/
├── package.json
├── cordis.patch.yml
├── build.mjs                 # 只打包 client
├── README.md
├── ARCHITECTURE.md           # 本文
├── lib/
│   ├── index.js              # host 入口：装配（wiring only）
│   ├── host/
│   │   ├── edge/{locator,cdp,browser}.js
│   │   ├── render/{session,waits}.js
│   │   ├── exporters/{registry,png,jpeg,pdf,svg}.js
│   │   ├── service/{render-service,artifacts}.js
│   │   └── adapters/{http-route,agent-tool}.js
│   └── client.js             # 构建产物（client/ 打包而来）
├── client/
│   ├── index.js  panel.js  preview.js  export-menu.js
│   ├── host-api.js  styles.js  i18n.js
├── test/
│   ├── locator.test.mjs
│   ├── cdp.test.mjs
│   └── render.smoke.mjs      # 真启 Edge，跑通一次 PNG
└── README.md
```

---

## 9. 里程碑

| 阶段 | 交付 | 验收方式 | 状态 |
|---|---|---|---|
| **M1 内核** | locator + cdp + browser + session + png 导出 + smoke 脚本 | 命令行跑一次，产出 PNG 并能打开 | ✅ 609ms 出图 |
| **M2 全格式** | jpeg / pdf / svg 导出器 + registry | 同一份 HTML 出四种格式 | ✅ 四种格式全通 |
| **M3 服务与工具** | render-service + artifacts + http-route + agent-tool | 我用 `html_render` 工具自己能截图 | ✅ 宿主内实测通过 |
| **M4 面板** | client 全部 + 预览 + 导出菜单 | 在 DSH 里交互、点导出、拿到文件 | ✅ 已装进 profile，待人工点验 |
| **M5 打磨** | actions 交互序列、整页截图、SVG 背景内联、产物修剪 | 逐项手测 | 🔶 进行中 |

### 已验证的能力（实测记录）

- 四种格式同源导出：PNG 1.05 MB / JPG 81 KB / PDF 79 KB / SVG 1.8 KB
- 交互态导出：`click #tab2` 后截图，导出的确实是点击后的状态
- SVG 背景内联：`background-color` / `color` / `font-family` 写进包装 div，引号转义为 `&quot;`
- 产物修剪：`keep: 3` 时连存 5 个，目录只剩 3 个
- 单元测试：locator 3 条 + service 9 条，全绿


> 每一层都可以单独测：L1 用假 HTML 测、L2 用 mock CDP 测、L3 用假 exporter 测、L4 用假 service 测。**不允许为了测试去改分层。**
