/**
 * "页面到底画好了没有？" —— 渲染层里唯一判断时机的地方。
 *
 * 解耦要点：本文件**不认识 CDP，也不认识浏览器**。它只接收一个
 * `evaluate(expression) => Promise<any>` 函数。真会话传真的，测试传假的，
 * 于是这一整套等待策略可以完全脱离 Edge 单测。
 *
 * 为什么需要这一层：`Page.setDocumentContent` 返回成功只代表"HTML 塞进去了"，
 * 不代表"字体加载完、图片解码完、CSS 过渡跑完了"。少等一步，
 * 截出来的图就是错位的、缺字的、半透明的。
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const DEFAULT_WAIT_OPTIONS = {
  /** 整个等待阶段的总预算 */
  timeoutMs: 15_000,
  /** 轮询间隔 */
  pollMs: 50,
  /** 一切就绪后再等一小会儿，给尾随的 CSS 过渡/动画留时间 */
  settleMs: 0,
  /** 额外的"必须出现这个元素"条件，例如图表容器 */
  waitForSelector: undefined,
};

/**
 * 合并默认值，但**忽略值为 undefined 的键**。
 *
 * 不能用 `{ ...DEFAULTS, ...options }`：调用方常常显式传 `{ timeoutMs: undefined }`
 * （比如把可选参数原样转发），展开运算符会让 undefined 覆盖掉默认值，
 * 于是超时预算变成 NaN，等待循环一次都不执行就直接报错。
 *
 * @template T
 * @param {T} defaults
 * @param {Partial<T>} [overrides]
 * @returns {T}
 */
function withDefaults(defaults, overrides) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

/**
 * 反复调用 predicate 直到它返回真值，超时则抛出带上下文的错误。
 *
 * @template T
 * @param {() => Promise<T>} predicate
 * @param {{ timeoutMs: number, pollMs: number, what: string }} options
 * @returns {Promise<T>}
 */
async function pollUntil(predicate, options) {
  const { timeoutMs, pollMs, what } = options;
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(pollMs);
  }

  const suffix = lastError ? ` (last error: ${lastError.message})` : '';
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${what}${suffix}`);
}

/**
 * 等页面真正可截图。
 *
 * 顺序是刻意的：
 *   1. readyState —— DOM 与子资源都到位；
 *   2. fonts.ready —— 自定义字体没加载完时文字会错位或缺失，这是最常见的"截图不对"来源；
 *   3. 图片解码 —— 只等未完成的，失败（error）也算完成，否则一张坏图能拖死整次渲染；
 *   4. 调用方指定的选择器 —— 图表库、React 挂载点之类；
 *   5. settleMs —— 收尾的动画/过渡。
 *
 * @param {(expression: string) => Promise<any>} evaluate
 * @param {Partial<typeof DEFAULT_WAIT_OPTIONS>} [options]
 */
export async function waitForReady(evaluate, options = {}) {
  const { timeoutMs, pollMs, settleMs, waitForSelector } = withDefaults(DEFAULT_WAIT_OPTIONS, options);

  await pollUntil(() => evaluate("document.readyState === 'complete'"), {
    timeoutMs,
    pollMs,
    what: 'document.readyState to become "complete"',
  });

  // 老引擎可能没有 document.fonts；没有就当已就绪，而不是报错。
  await evaluate(
    '(document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true)',
  );

  // 注意：这里用 load/error 双保险。超时交给外层，不在这里各自设 timer，
  // 否则 N 张图就有 N 个计时器，失败路径反而更难读。
  await evaluate(`
    Promise.all(
      [...document.images]
        .filter((image) => !image.complete)
        .map((image) => new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        })),
    ).then(() => true)
  `);

  if (typeof waitForSelector === 'string' && waitForSelector !== '') {
    await pollUntil(
      () => evaluate(`document.querySelector(${JSON.stringify(waitForSelector)}) !== null`),
      { timeoutMs, pollMs, what: `selector ${waitForSelector}` },
    );
  }

  if (settleMs > 0) await sleep(settleMs);
}
