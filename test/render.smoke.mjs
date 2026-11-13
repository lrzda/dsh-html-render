/**
 * 烟测：真启一次 Edge，把同一份 HTML 导出成四种格式。
 *
 * 这是 M1+M2 的验收脚本 —— 它不 mock 任何东西：
 *   定位 Edge → 启动进程 → 开页面 → 注入 HTML → 等就绪 → 四种导出 → 关进程。
 *
 * 运行：npm run smoke（或 node test/render.smoke.mjs）
 * 注意：Windows 上必须用完全权限跑，受限沙箱禁止浏览器创建进程间通道。
 */
import fs from 'node:fs';
import path from 'node:path';

import { BrowserHost } from '../lib/host/edge/browser.js';
import { getExporter, listFormats } from '../lib/host/exporters/registry.js';
import { openSession } from '../lib/host/render/session.js';

const HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #312e81 100%);
    min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px;
  }
  .card {
    width: 620px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18);
    border-radius: 24px; padding: 34px 38px; box-shadow: 0 24px 60px rgba(0,0,0,.45);
  }
  h1 { font-size: 26px; color: #fff; margin-bottom: 8px; }
  p { color: #93c5fd; font-size: 14px; margin-bottom: 22px; }
  .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .chip { background: rgba(147,197,253,.12); border: 1px solid rgba(147,197,253,.28);
          border-radius: 14px; padding: 14px 12px; text-align: center; color: #e0e7ff; font-size: 13px; }
  .chip b { display: block; font-size: 21px; color: #fbbf24; margin-bottom: 4px; }
  .bar { margin-top: 22px; height: 10px; border-radius: 99px; background: rgba(255,255,255,.12); overflow: hidden; }
  .bar i { display: block; height: 100%; width: 72%;
           background: linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6); border-radius: 99px; }
</style>
</head>
<body>
  <div class="card">
    <h1>dsh-html-render 烟测</h1>
    <p>四种格式都从这一份 HTML 产出，渲染引擎是本机 Edge。</p>
    <div class="row">
      <div class="chip"><b>4</b>导出格式</div>
      <div class="chip"><b>2x</b>像素比</div>
      <div class="chip"><b>0</b>外部依赖</div>
    </div>
    <div class="bar"><i></i></div>
  </div>
</body>
</html>`;

const outDir = path.join(import.meta.dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

const browser = new BrowserHost();
const report = [];

try {
  const started = Date.now();
  const page = await openSession(browser, {
    source: { kind: 'html', content: HTML },
    viewport: { width: 1000, height: 700, deviceScaleFactor: 2 },
    settleMs: 120,
  });

  const metrics = await page.metrics();
  console.log(`page ready in ${Date.now() - started}ms — content ${metrics.width}x${metrics.height}, viewport ${metrics.viewportWidth}x${metrics.viewportHeight}`);

  for (const { format } of listFormats()) {
    const exporter = getExporter(format);
    const file = path.join(outDir, `smoke${exporter.extension}`);
    try {
      const buffer = await exporter.run(page, { fullPage: true });
      fs.writeFileSync(file, buffer);
      report.push({ format, ok: true, bytes: buffer.length, file });
      console.log(`  ${format.padEnd(5)} -> ${buffer.length} bytes  ${path.basename(file)}`);
    } catch (error) {
      report.push({ format, ok: false, error: error.message });
      console.log(`  ${format.padEnd(5)} -> FAILED: ${error.message}`);
    }
  }

  await page.close();
} finally {
  await browser.close();
}

const failed = report.filter((item) => !item.ok);
if (failed.length > 0) {
  console.error(`\n${failed.length} format(s) failed: ${failed.map((f) => f.format).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${report.length} formats exported to ${outDir}`);
}
