/**
 * 列出 DSH app.asar 中包含指定关键词的路径。
 *
 * 用途：弄清客户端有哪些模块、哪些是可扩展的（比如 client-ui-*）。
 * 只读，不改动 asar。
 *
 * 用法：node asar-list.cjs [关键词]
 */
const fs = require('node:fs');

const ASAR = 'D:\\Program\\dsh\\resources\\app.asar';
const keyword = (process.argv[2] ?? '').toLowerCase();

const buffer = fs.readFileSync(ASAR);
// asar 头：前 16 字节是 pickle 头，第 12 字节起是 JSON 头的长度
const jsonSize = buffer.readUInt32LE(12);
const header = JSON.parse(buffer.subarray(16, 16 + jsonSize).toString('utf8'));

const out = [];
function walk(node, prefix) {
  for (const [name, entry] of Object.entries(node.files ?? {})) {
    const full = `${prefix}/${name}`;
    if (entry.files) {
      walk(entry, full);
    } else if (keyword === '' || full.toLowerCase().includes(keyword)) {
      out.push({ path: full, size: entry.size });
    }
  }
}
walk(header, '');

console.log(`total matched: ${out.length}`);
for (const item of out.slice(0, 400)) {
  console.log(`${String(item.size).padStart(9)}  ${item.path}`);
}
