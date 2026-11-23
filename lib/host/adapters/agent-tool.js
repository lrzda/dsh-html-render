/**
 * agent 的门面：`html_render` 工具。
 *
 * 和服务层的关系是"翻译"：把工具参数翻成服务层的请求对象，把结构化结果
 * 翻成一段人能读、模型能直接理解的文本。
 *
 * 输出刻意做成纯文本 + 明确路径：模型拿到路径后可以自己去 read_image 看图，
 * 形成"写页面 → 渲染 → 看效果 → 改"的闭环。
 */
import { listFormats } from '../exporters/registry.js';

const FORMAT_ENUM = listFormats().map((item) => item.format);

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

/**
 * @param {{ service: ReturnType<import('../service/render-service.js').createRenderService> }} options
 */
export function createAgentTool(options) {
  const { service } = options;

  return {
    name: 'html_render',
    description:
      'Render HTML/CSS/JS with the local Microsoft Edge and export it to a file, then return that file path. ' +
      'Use it to see your own front-end output: write the page, call this with source.kind "html" and format "png", ' +
      'then read the returned PNG with the image reader to check what actually rendered. ' +
      'Supports png, jpeg, pdf and svg. For svg, a page whose main content is a native <svg> exports as true vector; ' +
      'an ordinary HTML page is wrapped in <foreignObject> and may render differently in non-browser tools. ' +
      'Pass actions to interact before exporting (click, type, scroll, eval, wait, waitFor), so a screenshot reflects ' +
      'the state after those interactions. Pass options.fullPage true to capture the whole scrollable page.',
    parameters: {
      type: 'object',
      properties: {
        source: {
          type: 'object',
          description: 'What to render. Exactly one of content / path / url is used, depending on kind.',
          properties: {
            kind: { type: 'string', enum: ['html', 'file', 'url'] },
            content: { type: 'string', description: 'Raw HTML for kind "html". Max 4 MB.' },
            path: { type: 'string', description: 'Path to an .html file for kind "file".' },
            url: { type: 'string', description: 'http(s) URL for kind "url".' },
          },
          required: ['kind'],
          additionalProperties: false,
        },
        format: {
          type: 'string',
          enum: FORMAT_ENUM,
          description: 'Output format. Default png.',
        },
        viewport: {
          type: 'object',
          description: 'Rendering viewport. Default 1280x800 at deviceScaleFactor 1; use 2 for hi-dpi output.',
          properties: {
            width: { type: 'number' },
            height: { type: 'number' },
            deviceScaleFactor: { type: 'number' },
          },
          additionalProperties: false,
        },
        options: {
          type: 'object',
          description: 'Format-specific options.',
          properties: {
            fullPage: { type: 'boolean', description: 'Capture beyond the viewport (png/jpeg).' },
            quality: { type: 'number', description: 'JPEG quality 1-100.' },
            printBackground: { type: 'boolean', description: 'PDF: keep background colours.' },
          },
          additionalProperties: false,
        },
        actions: {
          type: 'array',
          description: 'Interaction steps executed before export.',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['click', 'type', 'scroll', 'eval', 'wait', 'waitFor'] },
              selector: { type: 'string' },
              text: { type: 'string' },
              script: { type: 'string' },
              ms: { type: 'number' },
              x: { type: 'number' },
              y: { type: 'number' },
            },
            required: ['type'],
            additionalProperties: false,
          },
        },
        waitForSelector: {
          type: 'string',
          description: 'Extra CSS selector that must exist before exporting (useful for async charts).',
        },
      },
      required: ['source'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'string' },
      render: (args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
    },
    timeoutMs: 120_000,
    isConcurrencySafe: () => false,
    presentCall: (args) => ({
      card: 'generic',
      title: `Render ${typeof args.format === 'string' ? args.format : 'png'}`,
      kind: 'html-render',
      rawInput: args,
    }),

    async execute(args) {
      const result = await service.export(args);
      const lines = [
        `Exported ${result.format} ${result.width}x${result.height} (${formatBytes(result.bytes)})`,
        `file: ${result.file}`,
        `id: ${result.id}`,
      ];
      if (result.format === 'png' || result.format === 'jpeg') {
        lines.push('Read this file with the image reader to inspect the rendered result.');
      }

      // 会话内预览：DSH 的会话消息按 markdown 渲染，所以把产物用 markdown 图片语法
      // 塞进工具结果里，画面就能直接出现在对话中 —— 这条路不依赖 slot 注册，
      // 也比让插件接管工具卡片更稳（tool.call.toolview 实测被调用了但渲染不可见）。
      if (['png', 'jpeg', 'svg'].includes(result.format)) {
        lines.push(
          '',
          `![渲染结果](/api/html-render/artifact?id=${encodeURIComponent(result.id)})`,
        );
      }

      return lines.join('\n');
    },
  };
}
