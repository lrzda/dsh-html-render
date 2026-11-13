/**
 * 客户端 bundle 的静态验证：不开浏览器，直接模拟宿主的加载流程。
 *
 * 验证三件事：
 *   1. bundle 真的调用了 `window.__ModuleLoader__.load`，且 id 正确；
 *   2. factory 返回的插件对象有 `inject` 和 `apply`；
 *   3. `apply(ctx)` 在假 ctx 上跑完，注册出来的 slot 名称 / id / key 符合 DSH 约定。
 *
 * 这能提前抓出"面板白屏"这类问题里最常见的成因：slot 名字拼错、
 * 组件工厂在 apply 阶段就抛异常、id 与包名不一致。
 */
import fs from 'node:fs';
import path from 'node:path';

const bundlePath = path.join(import.meta.dirname, '..', 'lib', 'client.js');
const code = fs.readFileSync(bundlePath, 'utf8');

/** 够用的 React stub：只提供组件工厂在加载阶段会解构到的成员。 */
const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect: () => undefined,
  useRef: (initial) => ({ current: initial }),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
};

const documentStub = {
  createElement: () => ({ dataset: {}, textContent: '', parentNode: null }),
  head: { appendChild: () => undefined },
};

let captured = null;
const windowStub = {
  __ModuleLoader__: {
    load: (config) => {
      captured = config;
    },
  },
};

const requireStub = (id) => {
  if (id === 'react') return React;
  throw new Error(`unexpected require: ${id}`);
};

// eslint-disable-next-line no-new-func
new Function('window', 'require', 'document', code)(windowStub, requireStub, documentStub);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

check(captured !== null, 'bundle did not call window.__ModuleLoader__.load');
check(captured?.id === 'dsh-html-render', `bundle id is ${String(captured?.id)}, expected dsh-html-render`);

const plugin = captured.factory(requireStub);
check(Array.isArray(plugin?.inject), 'plugin.inject is not an array');
check(plugin.inject?.includes('slots'), 'plugin.inject is missing "slots"');
check(typeof plugin?.apply === 'function', 'plugin.apply is not a function');

const registered = [];
const ctx = {
  get: (service) => (service === 'locale' ? null : undefined),
  effect: (factory) => {
    const dispose = factory();
    return () => {
      if (typeof dispose === 'function') dispose();
    };
  },
  slots: {
    inject: (_name, factory) => factory(),
    register: (spec, component) => {
      registered.push({ ...spec, component });
      return () => {};
    },
  },
};

plugin.apply(ctx);

console.log(`bundle id      : ${captured.id}`);
console.log(`inject         : ${JSON.stringify(plugin.inject)}`);
console.log(`slots registered: ${registered.length}`);
for (const spec of registered) {
  console.log(`  - ${spec.name}  id/key: ${spec.id ?? spec.key ?? '(none)'}  order: ${spec.order ?? '-'}`);
}

const sidebar = registered.find((spec) => spec.name === 'sidebar.panellist');
const main = registered.find((spec) => spec.name === 'main');

check(sidebar !== undefined, 'no sidebar.panellist slot registered');
check(sidebar?.id === 'dsh-html-render', 'sidebar.panellist id is not dsh-html-render');
check(main !== undefined, 'no main slot registered');
check(main?.key === 'dsh-html-render', 'main slot key is not dsh-html-render');

// 真渲染一次面板组件：slot 里注册的是 `() => createElement(Panel, …)`，
// 所以先拿到那个元素，再调用它 type(面板函数) 本身。hooks 用 stub，
// 于是这里能验证"组件函数体执行时不抛异常"，而不是只验证 slot 名字对不对。
if (main?.component) {
  try {
    const element = main.component({ locale: null });
    const rendered = typeof element?.type === 'function' ? element.type(element.props ?? {}) : element;
    check(rendered !== undefined && rendered !== null, 'panel component rendered nothing');
    const className = rendered?.props?.className ?? '(not a plain element)';
    console.log(`panel root    : ${String(className)}`);
  } catch (error) {
    failures.push(`panel component threw during render: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error('\nFAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('\nclient bundle loads and registers every slot correctly.');
}
