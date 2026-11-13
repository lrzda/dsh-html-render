/**
 * 宿主入口：只做装配。
 *
 * 这个文件里不应该出现业务判断 —— 它把"产物仓库 → 渲染服务 → 两个门面"
 * 串起来，再交给 DSH 的 webServer 和 tools 注册。想改行为，去改对应的层。
 */
import os from 'node:os';

import { createAgentTool } from './host/adapters/agent-tool.js';
import { createHttpRoute, ROUTE_PREFIX } from './host/adapters/http-route.js';
import { createArtifactStore } from './host/service/artifacts.js';
import { createRenderService } from './host/service/render-service.js';

export const name = 'dsh-html-render';

export const inject = ['tools', 'webServer'];

export function apply(ctx) {
  const artifacts = createArtifactStore();

  const service = createRenderService({
    artifacts,
    // kind:"file" 只允许读这些根目录下的文件，防止被当成任意文件读取器
    allowedRoots: [process.cwd(), os.homedir(), artifacts.root],
  });

  const route = createHttpRoute({ service });
  const tool = createAgentTool({ service });

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler: route }),
    'dsh-html-render: route',
  );

  ctx.effect(() => ctx.tools.register(tool), 'dsh-html-render: tool');

  // 插件卸载/停用时回收浏览器进程
  ctx.effect(() => () => service.shutdown(), 'dsh-html-render: shutdown');
}
