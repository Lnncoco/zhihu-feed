/** 面板页面选择器对应的五种知乎页面类型 */
export type PageType = 'home' | 'question' | 'answer' | 'column' | 'hot';

/** 面板页面选择器的选项顺序与文案的唯一来源 */
export const PAGES: { id: PageType; label: string }[] = [
  { id: 'home', label: '首页' },
  { id: 'question', label: '问题页' },
  { id: 'answer', label: '阅读页' },
  { id: 'hot', label: '热榜页' },
  { id: 'column', label: '专栏页' },
];

export type Route = PageType | 'other';

export function pageOfPathname(pathname: string): Route {
  if (pathname === '/' || pathname === '') return 'home';
  // 关注页 /follow 与首页同构（Topstory 主栏 + 右侧栏），并入首页类；(\/|$) 防 /followed 之类前缀撞车
  if (/^\/follow(\/|$)/.test(pathname)) return 'home';
  // 数字段一律以 (\d+) 收尾并锚段边界，防 /question/123abc 这类前缀撞车
  if (/^\/question\/\d+\/answer\/\d+(\/|$)/.test(pathname)) return 'answer';
  if (/^\/question\/\d+(\/|$)/.test(pathname)) return 'question';
  if (/^\/p\/\d+(\/|$)/.test(pathname)) return 'column';
  // 专栏目录页（/column/c_xxx）与专栏文章页同属「专栏页」；(\/|$) 防 /column-square 前缀撞车
  if (/^\/column(\/|$)/.test(pathname)) return 'column';
  // 精确段匹配：/hot 与 /hot/... 才是热榜页，/hotlist 之类前缀不算
  if (/^\/hot(\/|$)/.test(pathname)) return 'hot';
  return 'other';
}

/** popup 依据 tab url 判定页面类型 */
export function pageOfUrl(url: string): Route {
  try {
    const { hostname, pathname } = new URL(url);
    if (!/(^|\.)zhihu\.com$/.test(hostname)) return 'other';
    return pageOfPathname(pathname);
  } catch {
    return 'other';
  }
}

/**
 * 监听路由变化并回调（SPA 路由）。
 * 换页事件由 entrypoints/router.content.ts（MAIN world）广播；
 * isolated world 收到事件后自行重读 pathname。
 */
export function trackRoute(onChange: (route: Route) => void): void {
  let last: Route | null = null;
  const tick = () => {
    const route = pageOfPathname(location.pathname);
    if (route !== last) {
      last = route;
      onChange(route);
    }
  };
  tick();
  window.addEventListener('zf-route-change', tick);
}
