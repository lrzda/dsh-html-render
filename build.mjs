/**
 * 只打包客户端。
 *
 * 为什么只需要打包 client：DSH 的 client 半面是"单文件 + 运行时 require"的形态
 * （`window.__ModuleLoader__.load({ factory(require) })`），不能自己去 import 相对路径；
 * 而 host 侧是普通 Node ESM，天生多文件，不需要构建。
 *
 * 做法：esbuild 打成 CJS，把 `react` 标为 external（由宿主的 require 提供），
 * 再把产物包进 `__ModuleLoader__.load` 的工厂函数里。
 */
import fs from 'node:fs';
import path from 'node:path';

import { build } from 'esbuild';

const root = import.meta.dirname;
const entry = path.join(root, 'client', 'index.js');
const outFile = path.join(root, 'lib', 'client.js');

const result = await build({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  external: ['react'], // 宿主通过 factory(require) 注入
  write: false,
  logLevel: 'warning',
  legalComments: 'none',
});

const code = result.outputFiles[0].text;

const wrapped =
  "window.__ModuleLoader__.load({ id: 'dsh-html-render', factory(require) {\n" +
  'const module = { exports: {} };\n' +
  'const exports = module.exports;\n' +
  code +
  '\nreturn module.exports && module.exports.default ? module.exports.default : module.exports;\n' +
  '} });\n';

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, wrapped, 'utf8');

console.log(`built ${path.relative(root, outFile)} — ${wrapped.length} bytes`);
