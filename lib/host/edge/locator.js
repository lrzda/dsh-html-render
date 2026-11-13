/**
 * 定位本机的 Microsoft Edge。
 *
 * 这一层是纯查找，不做启动、不碰网络：给 `browser.js` 一个可执行文件的绝对路径，
 * 就完成了它的全部职责。找不到时抛出带上下文的错误，而不是返回 null，
 * 让调用方（服务层）只处理一种失败形态。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 逻辑名 → 可执行文件名。以后要支持 Chrome，只在这里加一行。 */
export const BROWSERS = {
  edge: 'msedge.exe',
  chrome: 'chrome.exe',
};

/**
 * 各浏览器在 Windows 上的常见安装位置。
 * 顺序就是优先级：先 x86（Edge 默认装在这里），再 64 位目录。
 */
const INSTALL_DIRS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application',
  'C:\\Program Files\\Microsoft\\Edge\\Application',
  'C:\\Program Files\\Google\\Chrome\\Application',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application',
];

const exists = (file) => {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
};

/**
 * 列出所有可能命中的候选路径，不做存在性检查。
 * 拆出来是为了让测试可以不碰真实磁盘地断言"路径怎么拼出来的"。
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {string[]}
 */
export function candidatePaths(env = process.env) {
  const roots = [...INSTALL_DIRS];
  const local = env.LOCALAPPDATA;
  if (local) {
    roots.push(path.join(local, 'Microsoft', 'Edge', 'Application'));
    roots.push(path.join(local, 'Google', 'Chrome', 'Application'));
  }
  return roots.map((dir) => path.join(dir, BROWSERS.edge));
}

/**
 * 在 PATH 里找一个可执行文件（仅 Windows 语义：按扩展名尝试）。
 *
 * @param {string} fileName
 * @param {NodeJS.ProcessEnv} env
 * @returns {string | undefined}
 */
function searchPath(fileName, env) {
  const entries = (env.PATH ?? env.Path ?? '').split(path.delimiter).filter(Boolean);
  for (const dir of entries) {
    const full = path.join(dir, fileName);
    if (exists(full)) return full;
  }
  return undefined;
}

/**
 * 找到 Edge 的可执行文件。
 *
 * @param {{ override?: string, env?: NodeJS.ProcessEnv, fileName?: string }} [options]
 * @returns {{ path: string, fileName: string, source: 'override' | 'install-dir' | 'path' }}
 * @throws {Error} 一个都没找到时
 */
export function findEdge(options = {}) {
  const { override, env = process.env, fileName = BROWSERS.edge } = options;

  if (typeof override === 'string' && override.trim() !== '') {
    const resolved = path.resolve(override.trim());
    if (!exists(resolved)) throw new Error(`edge path not found: ${resolved}`);
    return { path: resolved, fileName, source: 'override' };
  }

  for (const candidate of candidatePaths(env)) {
    if (exists(candidate)) return { path: candidate, fileName, source: 'install-dir' };
  }

  const fromPath = searchPath(fileName, env);
  if (fromPath !== undefined) return { path: fromPath, fileName, source: 'path' };

  throw new Error(
    `Microsoft Edge not found. Checked ${candidatePaths(env).length} install locations and PATH. ` +
      'Install Edge, or set DSH_HTML_RENDER_EDGE to its full path.',
  );
}
