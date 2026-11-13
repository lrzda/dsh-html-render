import assert from 'node:assert/strict';
import { test } from 'node:test';

import { candidatePaths, findEdge } from '../lib/host/edge/locator.js';

test('candidatePaths 按优先级给出安装位置', () => {
  const paths = candidatePaths({ LOCPATH: undefined, LOCALAPPDATA: 'C:\\Users\\x\\AppData\\Local' });
  assert.ok(paths.length >= 4);
  assert.match(paths[0], /Program Files \(x86\)\\Microsoft\\Edge\\Application\\msedge\.exe$/);
  assert.ok(paths.some((p) => p.includes('AppData\\Local\\Microsoft\\Edge')));
});

test('findEdge 能找到本机 Edge', () => {
  const found = findEdge();
  assert.match(found.path, /msedge\.exe$/i);
  assert.ok(['install-dir', 'path', 'override'].includes(found.source));
});

test('override 指向不存在的文件时报错', () => {
  assert.throws(() => findEdge({ override: 'C:\\nope\\msedge.exe' }), /edge path not found/);
});
