// MAIN world 内容脚本：知乎 SPA 换页走 history.pushState/replaceState，
// isolated world 里 patch 拦不到页面调用，必须注入主世界广播事件；
// 事件可跨 world 投递（detail 不行），isolated 侧收到后自己重读 pathname。
// 见 src/pages/index.ts 的监听端。
export default defineContentScript({
  matches: ['*://www.zhihu.com/*', '*://zhuanlan.zhihu.com/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    const notify = () => window.dispatchEvent(new Event('zf-route-change'));
    type PushState = typeof history.pushState;
    for (const fn of ['pushState', 'replaceState'] as const) {
      const orig = history[fn] as PushState;
      history[fn] = function (this: History, ...args: Parameters<PushState>) {
        const ret = orig.apply(this, args);
        notify();
        return ret;
      } as PushState;
    }
    window.addEventListener('popstate', notify);
  },
});
