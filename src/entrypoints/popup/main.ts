// 面板入口：渲染与交互。生效语义全部来自 @/switches/resolve，
// 持久化全部来自 @/settings——本文件不得出现级联判断或 chrome.storage 直用。
import { SWITCHES, REGION_ORDER, REGION_TITLES, type Region, type Switch } from '@/switches';
import { isActive, suppressorOf } from '@/switches/resolve';
import { getOverrides, setOverrides, type Overrides } from '@/settings';
import { COUNTS_MSG, type CountsResponse } from '@/settings/messages';import { PAGES, pageOfUrl, type PageType } from '@/pages';

let overrides: Overrides = {};

const PAGE_ORDER = PAGES.map((p) => p.id);

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const currentPage: PageType | 'other' = tab?.url ? pageOfUrl(tab.url) : 'other';
let view: PageType = currentPage === 'other' ? 'home' : currentPage;

/** 被父开关接管的子项默认收起，记住手动展开的父开关 */
const expanded = new Set<string>();

const tabsEl = document.querySelector<HTMLElement>('#tabs')!;
const panelEl = document.querySelector<HTMLElement>('#panel')!;
const chipEl = document.querySelector<HTMLElement>('#current-chip')!;

/** 该开关在本页是否被父开关接管；是则返回父标题 */
function suppressorTitle(f: Switch, page: PageType): string | null {
  return suppressorOf(f, overrides, page)?.title ?? null;
}

function onPage(page: PageType): Switch[] {
  return SWITCHES.filter((f) => f.pages.includes(page));
}

function renderTabs(): void {
  tabsEl.textContent = '';
  for (const { id: page, label } of PAGES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab';
    btn.role = 'tab';
    btn.dataset.page = page;
    btn.setAttribute('aria-selected', String(page === view));
    btn.tabIndex = page === view ? 0 : -1;
    btn.textContent = label;
    if (page === currentPage) {
      const dot = document.createElement('i');
      dot.className = 'dot';
      dot.title = '你正在浏览这个页面';
      btn.prepend(dot);
    }
    btn.addEventListener('click', () => selectTab(page));
    btn.addEventListener('keydown', onTabKeydown);
    tabsEl.append(btn);
  }
}

function onTabKeydown(e: KeyboardEvent): void {
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!delta) return;
  e.preventDefault();
  const idx = (PAGE_ORDER.indexOf(view) + delta + PAGE_ORDER.length) % PAGE_ORDER.length;
  const next = PAGE_ORDER[idx]!;
  selectTab(next);
  tabsEl.querySelector<HTMLElement>(`.tab[data-page="${next}"]`)?.focus();
}

function selectTab(page: PageType): void {
  view = page;
  render();
}

function render(): void {
  renderTabs();
  panelEl.textContent = '';

  const features = onPage(view);
  for (const region of REGION_ORDER) {
    const tops = features.filter(
      (f) => f.region === region && !isNestedUnderShownParent(f, features),
    );
    if (!tops.length) continue;
    const label = document.createElement('h2');
    label.className = 'region';
    label.textContent = REGION_TITLES[region];
    panelEl.append(label);
    for (const top of tops) renderGroup(top, features, region);
  }
}

/** 子开关（有 suppressedBy 且父在本页出现）不单独占位，由 renderGroup 随父渲染 */
function isNestedUnderShownParent(f: Switch, features: Switch[]): boolean {
  return !!f.suppressedBy && features.some((x) => x.id === f.suppressedBy);
}

function renderGroup(
  parent: Switch,
  features: Switch[],
  region: Region,
  isChild = false,
  withHits = view === currentPage,
): void {
  panelEl.append(row(parent, { isChild, withHits }));
  const children = features.filter((f) => f.suppressedBy === parent.id && f.region === region);
  if (!children.length) return;

  if (!isActive(parent, overrides, view)) {
    // 父开关关掉后子项可独立操作，直接展开
    for (const child of children) {
      renderGroup(child, features, region, true, view === currentPage);
    }
    return;
  }
  if (!expanded.has(parent.id)) {
    panelEl.append(disclosure(parent, descendantCount(parent, features, region)));
    return;
  }
  for (const child of children) renderGroup(child, features, region, true, false);
}

function descendantCount(parent: Switch, features: Switch[], region: Region): number {
  const children = features.filter((f) => f.suppressedBy === parent.id && f.region === region);
  return children.reduce((count, child) => count + 1 + descendantCount(child, features, region), 0);
}

function disclosure(parent: Switch, count: number): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'disclose';
  btn.textContent = `${count} 项已被接管`;
  btn.addEventListener('click', () => {
    expanded.add(parent.id);
    render();
  });
  return btn;
}

function row(f: Switch, opts: { isChild?: boolean; withHits: boolean }): HTMLElement {
  const suppressed = suppressorTitle(f, view);
  // label 会把行内点击转发给第一个可标记控件（button 也算），两态切换行改用 div 避免误触
  const el = document.createElement(f.segments ? 'div' : 'label');
  el.className = opts.isChild ? (suppressed ? 'row child off' : 'row child') : 'row';

  const info = document.createElement('span');
  info.className = 'info';
  const line1 = document.createElement('span');
  line1.className = 'line1';
  const title = document.createElement('b');
  title.textContent = f.title;
  line1.append(title);
  const b = badge(f);
  if (b) line1.append(b);
  if (opts.withHits) line1.append(hits(f.id));

  const desc = document.createElement('span');
  desc.className = 'desc';
  desc.textContent = suppressed ? `已由「${suppressed}」接管` : f.desc;

  info.append(line1, desc);
  el.append(
    info,
    f.segments ? segControl(f, suppressed !== null) : toggleControl(f, suppressed !== null),
  );
  return el;
}

function commit(id: string, value: boolean): void {
  overrides[id] = value;
  setOverrides(overrides);
  render();
  if (view === currentPage) loadCounts();
}

function toggleControl(f: Switch, disabled: boolean): HTMLElement {
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.className = 'toggle';
  toggle.checked = isActive(f, overrides, view);
  toggle.disabled = disabled;
  toggle.addEventListener('change', () => commit(f.id, toggle.checked));
  return toggle;
}

/** 两态文字切换（如小字/大字）：语义直接写在按钮上，不依赖「开=拿走」约定 */
function segControl(f: Switch, disabled: boolean): HTMLElement {
  const seg = f.segments!;
  const on = isActive(f, overrides, view);
  const wrap = document.createElement('span');
  wrap.className = 'seg';
  wrap.setAttribute('role', 'radiogroup');
  wrap.setAttribute('aria-label', f.title);
  for (const [value, label] of [
    [false, seg.off],
    [true, seg.on],
  ] as [boolean, string][]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seg-opt';
    btn.textContent = label;
    btn.disabled = disabled;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(on === value));
    btn.addEventListener('click', () => {
      if (on !== value) commit(f.id, value);
    });
    wrap.append(btn);
  }
  return wrap;
}

/** 锚点全部核实过就不标记；只在异常情况下提示 */
function badge(f: Switch): HTMLElement | null {
  if (f.anchors.every((a) => a.status === 'verified')) return null;
  const badge = document.createElement('i');
  badge.className = 'badge todo';
  badge.textContent = '待核实';
  badge.title = f.anchors.map((a) => `${a.selector} · ${a.status}`).join('\n');
  return badge;
}

function hits(id: string): HTMLElement {
  const el = document.createElement('i');
  el.className = 'hits';
  el.dataset.id = id;
  return el;
}

async function loadCounts(): Promise<void> {
  if (currentPage === 'other' || !tab?.id) return;
  let counts: CountsResponse | null = null;
  try {
    counts = await chrome.tabs.sendMessage(tab.id, { type: COUNTS_MSG });
  } catch {
    // 页面无 content script（未注入或尚未加载完）
  }
  if (!counts) return;
  for (const el of panelEl.querySelectorAll<HTMLElement>('.hits[data-id]')) {
    const total = counts[el.dataset.id!] ?? 0;
    el.textContent = total > 0 ? `露出 ${total} 处` : '无目标';
    el.classList.toggle('zero', total === 0);
  }
}

// 当前页由 tab 上的圆点表达；只有在非知乎页面上才需要文字提示
chipEl.textContent = '非知乎页面';
chipEl.hidden = currentPage !== 'other';
overrides = await getOverrides();
render();
loadCounts();
