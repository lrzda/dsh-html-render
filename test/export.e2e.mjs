/**
 * 端到端：走真正的服务层入口 `service.export()`。
 *
 * 和 render.smoke.mjs 的区别：那个直接调 session + exporter（验证内核），
 * 这个走 服务 → 会话 → 导出 → 产物仓库（验证面板/工具真正使用的那条路径）。
 *
 * 需要完全权限：会真启 Edge。
 */
import path from 'node:path';

import { createArtifactStore } from '../lib/host/service/artifacts.js';
import { createRenderService } from '../lib/host/service/render-service.js';

const HTML = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<style>
  body { margin:0; font-family:"Microsoft YaHei",sans-serif; background:#0b1220; color:#e2e8f0; padding:48px; }
  h1 { color:#38bdf8; font-size:30px; }
  .grid { display:flex; gap:12px; margin-top:24px; }
  .box { flex:1; background:#16233c; border:1px solid #2a3a5c; border-radius:14px; padding:18px; }
  .box b { display:block; color:#fbbf24; font-size:22px; margin-bottom:6px; }
</style></head>
<body>
  <h1>服务层端到端验证</h1>
  <p>这条路径就是面板按钮和 html_render 工具真正走的那条。</p>
  <div class="grid">
    <div class="box"><b>01</b>normalizeRequest</div>
    <div class="box"><b>02</b>openSession</div>
    <div class="box"><b>03</b>exporter.run</div>
    <div class="box"><b>04</b>artifacts.save</div>
  </div>
</body></html>`;

const artifacts = createArtifactStore({ rootDir: path.join(import.meta.dirname, 'out', 'e2e') });
const service = createRenderService({ artifacts, allowedRoots: [process.cwd()] });

try {
  for (const format of ['png', 'pdf']) {
    const result = await service.export({
      source: { kind: 'html', content: HTML },
      format,
      viewport: { width: 900, height: 600, deviceScaleFactor: 2 },
      options: { fullPage: true },
    });
    console.log(
      `${format.padEnd(4)} -> ${result.width}x${result.height}  ${result.bytes} bytes  ${path.basename(result.file)}`,
    );
  }

  const listed = service.list({ limit: 5 });
  console.log(`\nartifacts listed: ${listed.length}`);
  for (const item of listed) console.log(`  ${item.id}  ${item.bytes} B`);
} finally {
  await service.shutdown();
}
