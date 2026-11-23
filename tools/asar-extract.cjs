/**
 * 从 DSH app.asar 里提取单个文件到 stdout。
 *
 * 用法：node asar-extract.cjs /dsh/node_modules/@deepseek-ai/dsh-client-ui-tool/README.md
 * 只读，不改动 asar。
 */
const fs = require('node:fs');

const ASAR = 'D:\\Program\\dsh\\resources\\app.asar';
const target = process.argv[2];
if (!target) {
  console.error('usage: node asar-extract.cjs <path-inside-asar>');
  process.exit(2);
}

const buffer = fs.readFileSync(ASAR);
const jsonSize = buffer.readUInt32LE(12);
const header = JSON.parse(buffer.subarray(16, 16 + jsonSize).toString('utf8'));
const dataOffset = 16 + jsonSize;

let node = header;
for (const part of target.split('/').filter(Boolean)) {
  node = node.files?.[part];
  if (!node) {
    console.error(`not found: ${part} (in ${target})`);
    process.exit(1);
  }
}
if (node.files) {
  console.error(`that is a directory: ${target}`);
  process.exit(1);
}

const start = dataOffset + Number(node.offset);
process.stdout.write(buffer.subarray(start, start + node.size));
