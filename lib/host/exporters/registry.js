/**
 * 导出格式注册表。
 *
 * 这是整个插件里**唯一**知道"有哪些格式"的地方：
 *   - 服务层通过 getExporter(format) 拿实现；
 *   - HTTP 路由通过 listFormats() 告诉面板该显示哪些按钮；
 *   - agent 工具通过 listFormats() 生成 enum。
 *
 * 加一种格式 = 新建一个导出器文件 + 在上面 imports 里加一行 + 数组里加一个元素。
 * 不需要改服务层、路由、工具、面板 —— 那些都只认注册表。
 */
import { exporter as jpeg } from './jpeg.js';
import { exporter as pdf } from './pdf.js';
import { exporter as png } from './png.js';
import { exporter as svg } from './svg.js';

/** @type {Map<string, {format: string, mime: string, extension: string, run: Function}>} */
const EXPORTERS = new Map();

for (const exporter of [png, jpeg, pdf, svg]) {
  if (EXPORTERS.has(exporter.format)) {
    throw new Error(`duplicate exporter registered for format: ${exporter.format}`);
  }
  EXPORTERS.set(exporter.format, exporter);
}

/**
 * 取一个导出器，取不到就抛出带可选值的错误。
 *
 * @param {string} format
 */
export function getExporter(format) {
  const exporter = EXPORTERS.get(format);
  if (!exporter) {
    const available = [...EXPORTERS.keys()].join(', ');
    throw new Error(`unsupported format: ${String(format)} (available: ${available})`);
  }
  return exporter;
}

/** @param {string} format */
export function hasFormat(format) {
  return EXPORTERS.has(format);
}

/** 给 UI / 工具 schema 用的格式清单，顺序稳定。 */
export function listFormats() {
  return [...EXPORTERS.values()].map(({ format, mime, extension }) => ({ format, mime, extension }));
}
