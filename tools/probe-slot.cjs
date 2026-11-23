/**
 * 在压缩后的 JS 里找关键词并打印上下文切片。
 *
 * 支持两种来源：
 *   node probe-slot.cjs asar <asar-内路径> <needle> [window]
 *   node probe-slot.cjs <本地文件> <needle> [window]
 *
 * 直接从 asar 读是为了绕开 PowerShell 重定向的编码坑（默认 UTF-16）。
 */
const fs = require('node:fs');

const ASAR = 'D:\\Program\\dsh\\resources\\app.asar';

function readFromAsar(innerPath) {
  const buffer = fs.readFileSync(ASAR);
  const jsonSize = buffer.readUInt32LE(12);
  const header = JSON.parse(buffer.subarray(16, 16 + jsonSize).toString('utf8'));
  let node = header;
  for (const part of innerPath.split('/').filter(Boolean)) {
    node = node.files?.[part];
    if (!node) throw new Error(`not found in asar: ${part}`);
  }
  const start = 16 + jsonSize + Number(node.offset);
  return buffer.subarray(start, start + node.size).toString('utf8');
}

const args = process.argv.slice(2);
let source;
let rest;

if (args[0] === 'asar') {
  source = readFromAsar(args[1]);
  rest = args.slice(2);
} else {
  source = fs.readFileSync(args[0], 'utf8');
  rest = args.slice(1);
}

const needle = rest[0];
const size = Number(rest[1] ?? 400);
const limit = Number(rest[2] ?? 5);

if (!needle) {
  console.error('usage: node probe-slot.cjs (asar <path> | <file>) <needle> [window] [limit]');
  process.exit(2);
}

let index = source.indexOf(needle);
let count = 0;
while (index !== -1 && count < limit) {
  const from = Math.max(0, index - size);
  const to = Math.min(source.length, index + size);
  console.log(`\n===== match ${count} @ ${index} =====`);
  console.log(source.slice(from, to));
  index = source.indexOf(needle, index + 1);
  count += 1;
}
console.log(`\n(total shown: ${count}, source length: ${source.length})`);
