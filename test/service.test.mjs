import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { normalizeRequest } from '../lib/host/service/render-service.js';
import { createArtifactStore } from '../lib/host/service/artifacts.js';
import { getExporter, listFormats } from '../lib/host/exporters/registry.js';

const context = { allowedRoots: [process.cwd()] };

test('四种格式都注册在案，且导出器契约完整', () => {
  const formats = listFormats().map((item) => item.format).sort();
  assert.deepEqual(formats, ['jpeg', 'pdf', 'png', 'svg']);
  for (const { format, mime, extension } of listFormats()) {
    assert.ok(mime.includes('/'));
    assert.ok(extension.startsWith('.'));
    const exporter = getExporter(format);
    assert.equal(typeof exporter.run, 'function');
  }
});

test('未知格式被拒绝，并列出可选值', () => {
  assert.throws(() => getExporter('webp'), /unsupported format: webp.*png/);
});

test('normalizeRequest 为 html 源套用默认视口', () => {
  const plan = normalizeRequest({ source: { kind: 'html', content: '<h1>hi</h1>' } }, context);
  assert.equal(plan.format, 'png');
  assert.deepEqual(plan.viewport, { width: 1280, height: 800, deviceScaleFactor: 1 });
  assert.equal(plan.options.fullPage, false);
});

test('normalizeRequest 把非法视口钳制到合法区间', () => {
  const plan = normalizeRequest(
    { source: { kind: 'html', content: 'x' }, viewport: { width: 99999, height: 0, deviceScaleFactor: 99 } },
    context,
  );
  assert.equal(plan.viewport.width, 8192);
  assert.equal(plan.viewport.height, 1);
  assert.equal(plan.viewport.deviceScaleFactor, 4);
});

test('normalizeRequest 拒绝越界的 source.kind 与非 http url', () => {
  assert.throws(() => normalizeRequest({ source: { kind: 'exec' } }, context), /unsupported source.kind/);
  assert.throws(
    () => normalizeRequest({ source: { kind: 'url', url: 'file:///etc/passwd' } }, context),
    /must be an http\(s\) URL/,
  );
});

test('normalizeRequest 拒绝超大的 html', () => {
  const content = 'x'.repeat(4 * 1024 * 1024 + 1);
  assert.throws(() => normalizeRequest({ source: { kind: 'html', content } }, context), /exceeds/);
});

test('kind:file 只允许允许根目录内的文件', () => {
  assert.throws(
    () => normalizeRequest({ source: { kind: 'file', path: 'C:\\Windows\\win.ini' } }, { allowedRoots: [process.cwd()] }),
    /outside the allowed roots/,
  );
});

test('产物仓库拒绝路径穿越的 id', () => {
  const store = createArtifactStore({ rootDir: path.join(process.cwd(), 'test', 'out', 'artifacts-test') });
  assert.throws(() => store.get('../../evil.png'), /invalid artifact id/);
  assert.throws(() => store.get('20260101-000000-deadbeef.exe'), /invalid artifact id/);
});

test('产物仓库能保存、列出、删除', () => {
  const store = createArtifactStore({ rootDir: path.join(process.cwd(), 'test', 'out', 'artifacts-test') });
  const saved = store.save(Buffer.from('hello'), { extension: '.png', mime: 'image/png' });
  assert.match(saved.id, /^\d{8}-\d{6}-[a-f0-9]{8}\.png$/);

  const listed = store.list({ limit: 10 });
  assert.ok(listed.some((item) => item.id === saved.id));

  assert.equal(store.get(saved.id), saved.file);
  store.remove(saved.id);
  assert.throws(() => store.get(saved.id), /not found/);
});
