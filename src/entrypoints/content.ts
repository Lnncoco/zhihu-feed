// 清理侧入口：只做生命周期编排（注入 CSS → 快照 apply → 权威对齐 → 路由跟踪 → counts 应答）。
// 持久化在 @/settings，生效语义在 @/switches/resolve，本文件不实现任何业务规则。
import cssText from '@/styles/content.css?inline';
import { SWITCHES } from '@/switches';
import { activeOnPage } from '@/switches/resolve';
import {
  getOverrides,
  onOverridesChanged,
  readSnapshot,
  writeSnapshot,
  type Overrides,
} from '@/settings';
import { COUNTS_MSG, type CountsResponse } from '@/settings/messages';
import { pageOfPathname, trackRoute, type PageType, type Route } from '@/pages';

let overrides: Overrides = {};
let route: Route = 'other';

function apply(): void {
  const root = document.documentElement;
  const page: PageType | null = route === 'other' ? null : route;
  const activeIds = new Set(page ? activeOnPage(overrides, page).map((s) => s.id) : []);
  for (const s of SWITCHES) {
    root.toggleAttribute(`data-zf-${s.id}`, activeIds.has(s.id));
  }
}

export default defineContentScript({
  matches: ['*://www.zhihu.com/*', '*://zhuanlan.zhihu.com/*'],
  // 知乎自己的 JS 执行前就注入：CSS 已在文档里、属性已同步挂好，
  // 后续懒加载的元素插入当帧即被命中隐藏，不会先画一帧再消失
  runAt: 'document_start',
  // Chrome 会把 manifest/注册式 CSS 文件缓存在浏览器进程里（重载扩展也难失效），
  // 这里走 WXT 官方 manual 模式：CSS 打进 JS，由本脚本注入 <style>
  cssInjectionMode: 'manual',
  async main() {
    const style = document.createElement('style');
    style.dataset.zfStyle = '';
    style.textContent = cssText;
    (document.head ?? document.documentElement).prepend(style);

    // 同步路径：快照（冷启动无快照则按注册表默认值）先挂属性，不等任何 await
    overrides = readSnapshot() ?? {};
    route = pageOfPathname(location.pathname);
    // 先安装事件监听再等待 storage，避免这段异步窗口里的 SPA 跳转漏报。
    // trackRoute 会立即以快照状态 apply 一次，保持 document_start 的首帧路径。
    trackRoute((r) => {
      route = r;
      apply();
    });

    // 异步对齐：storage.sync 是权威值，覆盖后留档给本标签页下次导航
    overrides = await getOverrides();
    writeSnapshot(overrides);
    apply();
    onOverridesChanged((o) => {
      overrides = o;
      writeSnapshot(o);
      apply();
    });

    // popup 打开时回报：逐个开关临时摘掉自己的属性再测量，得到「本页有几处目标」
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type !== COUNTS_MSG) return;
      sendResponse(measureVisibleHits());
    });
  },
});

function measureVisibleHits(): CountsResponse {
  const root = document.documentElement;
  const out: CountsResponse = {};
  for (const s of SWITCHES) {
    const attr = `data-zf-${s.id}`;
    const mounted = root.hasAttribute(attr);
    if (mounted) root.removeAttribute(attr);
    // 摘属性后必须同步重排，否则量到的还是旧的布局
    void root.offsetWidth;
    out[s.id] = s.anchors.reduce((n, a) => {
      let visible = 0;
      for (const el of document.querySelectorAll(a.selector)) {
        if (el.getClientRects().length > 0) visible++;
      }
      return n + visible;
    }, 0);
    if (mounted) root.setAttribute(attr, '');
  }
  void root.offsetWidth;
  return out;
}
