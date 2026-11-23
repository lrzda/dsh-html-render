/**
 * 从 asar 里的包 README 中提取 slot 名称。
 *
 * 用法：node scan-slots.cjs [包名...]
 * 默认扫描与对话渲染相关的几个包。
 */
const fs = require('node:fs');

const ASAR = 'D:\\Program\\dsh\\resources\\app.asar';
const buffer = fs.readFileSync(ASAR);
const jsonSize = buffer.readUInt32LE(12);
const header = JSON.parse(buffer.subarray(16, 16 + jsonSize).toString('utf8'));
const dataOffset = 16 + jsonSize;

function readFile(innerPath) {
  let node = header;
  for (const part of innerPath.split('/').filter(Boolean)) {
    node = node?.files?.[part];
    if (!node) return null;
  }
  const start = dataOffset + Number(node.offset);
  return buffer.subarray(start, start + node.size).toString('utf8');
}

const packages = process.argv.length > 2
  ? process.argv.slice(2)
  : [
      'dsh-client-ui-conversation',
      'dsh-client-ui-chat',
      'dsh-client-ui-tool',
      'dsh-client-ui-session',
      'dsh-client-ui-renderer',
    ];

// 匹配反引号或引号里的 slot 名，如 `conversation.chat.node`
const SLOT = /[`'"]([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+){1,3})[`'"]/g;

for (const pkg of packages) {
  for (const readme of ['README.zh.md', 'README.md']) {
    const text = readFile(`/dsh/node_modules/@deepseek-ai/${pkg}/${readme}`);
    if (!text) continue;

    const names = new Set();
    for (const match of text.matchAll(SLOT)) {
      const name = match[1];
      if (/^(conversation|chat|tool|sidebar|main|settings|plugins|composer|message)\b/.test(name)) {
        names.add(name);
      }
    }
    console.log(`\n### ${pkg} (${readme}) — ${names.size} slot-ish names`);
    for (const name of [...names].sort()) console.log(`  ${name}`);
    break;
  }
}
