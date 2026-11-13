/**
 * SVG 背景内联的回归检查。
 *
 * 修的是这样一个真问题：foreignObject 里没有 <body> 元素，
 * 页面里 `body { background: … }` 的规则匹配不到任何东西，导出的 SVG 会丢背景。
 * 现在导出器会把 body 的计算样式内联到包装 div 上 —— 这个脚本负责证明它真的写了进去。
 */
import { BrowserHost } from '../lib/host/edge/browser.js';
import { getExporter } from '../lib/host/exporters/registry.js';
import { openSession } from '../lib/host/render/session.js';

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0; min-height: 100vh; background-color: #123456; color: #fedcba;
         font-family: "Segoe UI", sans-serif; padding: 24px; }
  h1 { font-size: 28px; }
</style></head>
<body><h1>背景色应该在 SVG 里</h1><p>如果丢了背景，就是 foreignObject 的 body 选择器问题。</p></body></html>`;

const browser = new BrowserHost();
let ok = false;

try {
  const page = await openSession(browser, {
    source: { kind: 'html', content: HTML },
    viewport: { width: 800, height: 500, deviceScaleFactor: 1 },
  });

  const svg = (await getExporter('svg').run(page)).toString('utf8');
  const hasBackground = /background-color:\s*rgb\(18,\s*52,\s*86\)|background-color:\s*#123456/i.test(svg);
  const hasColor = /color:\s*rgb\(254,\s*220,\s*186\)/i.test(svg);
  const hasFont = /font-family:/i.test(svg);

  ok = hasBackground && hasColor && hasFont;
  console.log(`background inlined : ${hasBackground}`);
  console.log(`text colour inlined: ${hasColor}`);
  console.log(`font inlined       : ${hasFont}`);
  console.log(`svg bytes          : ${Buffer.byteLength(svg, 'utf8')}`);
  console.log('--- head ---');
  console.log(svg.slice(0, 520));

  await page.close();
} finally {
  await browser.close();
}

process.exitCode = ok ? 0 : 1;
