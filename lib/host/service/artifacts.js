/**
 * 产物仓库：负责"文件叫什么、放哪儿、怎么找回来"。
 *
 * 它不认识 HTML、不认识渲染、不认识 HTTP —— 只认 Buffer 和一个格式扩展名。
 * 所有对外接口都以 **id** 为单位，而 id 就是文件名本身；任何解析路径的操作
 * 都必须先过 `SAFE_ID` 这一关，所以调用方永远无法用 `../` 把读写引到别处。
 */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** 合法的产物 id：时间戳 + 随机串 + 白名单扩展名。 */
const SAFE_ID = /^\d{8}-\d{6}-[a-f0-9]{8}\.(png|jpg|jpeg|pdf|svg)$/;

/** 默认放在 DSH 数据目录下，和插件自身的状态放在一起。 */
function defaultRoot() {
  const home = process.env.DSH_HOME ?? path.join(os.homedir(), '.dsh');
  return path.join(home, 'html-render', 'artifacts');
}

/** 20261113-174400 形式的时间戳，可排序、无空格、可安全做文件名。 */
function stamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/**
 * @param {{ rootDir?: string }} [options]
 */
export function createArtifactStore(options = {}) {
  const root = options.rootDir ?? defaultRoot();
  /** 目录里最多保留多少个产物，超出的按修改时间从旧到新删除。 */
  const keep = options.keep ?? 200;
  fs.mkdirSync(root, { recursive: true });

  /**
   * 修剪产物目录：只留最近的 `limit` 个。
   *
   * 不做定时清理而是"写入即修剪"：目录只有在产出时才增长，
   * 所以每次 save 后顺手裁一次就够了，也不会在有任务跑着时删掉刚生成的产物。
   */
  function prune(limit) {
    const files = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile() && SAFE_ID.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        mtime: fs.statSync(path.join(root, entry.name)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const file of files.slice(limit)) {
      fs.rmSync(path.join(root, file.name), { force: true });
    }
  }

  /** id → 绝对路径。id 不合法时抛错，绝不返回一个可被拼接的字符串。 */
  function resolve(id) {
    if (typeof id !== 'string' || !SAFE_ID.test(id)) {
      throw new Error(`invalid artifact id: ${String(id)}`);
    }
    const file = path.join(root, id);
    // 双保险：即使正则被绕过，解析后的路径仍必须落在 root 内。
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`artifact id escapes the store: ${id}`);
    }
    return file;
  }

  return {
    root,

    /**
     * 落盘一个产物。
     *
     * @param {Buffer} buffer
     * @param {{ extension: string, mime?: string, meta?: Record<string, unknown> }} spec
     * @returns {{ id: string, file: string, bytes: number, createdAt: string, mime?: string }}
     */
    save(buffer, spec) {
      const extension = spec.extension.startsWith('.') ? spec.extension : `.${spec.extension}`;
      const id = `${stamp(new Date())}-${randomBytes(4).toString('hex')}${extension.toLowerCase()}`;
      const file = resolve(id);
      fs.writeFileSync(file, buffer, { flag: 'wx' });
      // 每次落盘顺手裁掉超量的旧产物。放在 save 里而不是定时器里：
      // 目录只有在产出时才会增长，所以"写入即修剪"不会漏。
      prune(keep);
      return {
        id,
        file,
        bytes: buffer.length,
        createdAt: new Date().toISOString(),
        ...(spec.mime ? { mime: spec.mime } : {}),
      };
    },

    /**
     * 列出最近的产物，最新的在前。
     *
     * @param {{ limit?: number }} [options]
     */
    list(options = {}) {
      const limit = Math.min(Math.max(Number(options.limit ?? 50), 1), 200);
      const entries = fs
        .readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isFile() && SAFE_ID.test(entry.name))
        .map((entry) => {
          const file = path.join(root, entry.name);
          const stat = fs.statSync(file);
          return {
            id: entry.name,
            file,
            bytes: stat.size,
            createdAt: stat.mtime.toISOString(),
            format: path.extname(entry.name).slice(1),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return entries.slice(0, limit);
    },

    /** 取一个产物的绝对路径；不存在就抛错。 */
    get(id) {
      const file = resolve(id);
      if (!fs.existsSync(file)) throw new Error(`artifact not found: ${id}`);
      return file;
    },

    /** 删除一个产物。 */
    remove(id) {
      const file = resolve(id);
      fs.rmSync(file, { force: true });
      return { deleted: true, id };
    },
  };
}
