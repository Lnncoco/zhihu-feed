// 开关树的构建与状态同步：只把注册表和 overrides 映射成 DOM。
// 生效判定来自 @/switches/resolve，交互通过 onToggle 交回入口，本文件不读写存储。
import { PAGES, type PageType } from '@/pages';
import {
  REGION_ORDER,
  REGION_TITLES,
  SWITCHES_BY_ID,
  isGlobalSwitch,
  isHideLike,
  type Region,
  type Switch,
} from '@/switches';
import { isActive, rangeValue, suppressorOf } from '@/switches/resolve';
import type { Overrides, Params } from '@/settings';

export type PanelKind = 'global' | 'page';

export interface PanelState {
  overrides: Overrides;
  params: Params;
  currentPage: PageType | 'other';
  selectedPage: PageType;
}

type ToggleHandler = (id: string, value: boolean) => void;
type RangeHandler = (id: string, value: number, immediate?: boolean) => void;

interface RenderContext {
  state: PanelState;
  page: PageType;
  onToggle: ToggleHandler;
  onParam: RangeHandler;
}

/** 面板按哪一页判定生效：全站列跟随当前页，页面列跟随选择器 */
export function effectivePage(kind: PanelKind, state: PanelState): PageType {
  if (kind === 'page') return state.selectedPage;
  return state.currentPage === 'other' ? state.selectedPage : state.currentPage;
}

/** 顶栏 9 项默认收起，首屏先给内容区与侧栏；其余分组默认展开 */
const closedGroups = new Set<string>(['global:header']);

function groupEl(
  region: Region,
  key: string,
  total: number,
): { details: HTMLDetailsElement; body: HTMLElement } {
  const details = document.createElement('details');
  details.className = 'group';
  details.dataset.group = key;
  details.open = !closedGroups.has(key);

  const head = document.createElement('summary');
  head.className = 'group-head';
  const chev = document.createElement('span');
  chev.className = 'chev';
  chev.setAttribute('aria-hidden', 'true');
  const title = document.createElement('span');
  title.className = 'group-title';
  title.textContent = REGION_TITLES[region];
  const count = document.createElement('span');
  count.className = 'group-count';
  count.textContent = `0/${total}`;
  head.append(chev, title, count);

  const body = document.createElement('div');
  body.className = 'group-body';
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.hidden = true;
  body.append(hint);

  details.append(head, body);
  details.addEventListener('toggle', () => {
    if (details.open) closedGroups.delete(key);
    else closedGroups.add(key);
  });
  return { details, body };
}

// 面板亮暗语义：亮=页面上显示，暗=隐藏。存储层仍是「hide 语义」（true=隐藏），
// 这里取反映射，避免「亮着却拿走了元素」的反直觉。
function shownOf(f: Switch, ctx: RenderContext): boolean {
  return !isActive(f, ctx.state.overrides, ctx.page);
}

function chipEl(f: Switch, ctx: RenderContext): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chipbtn';
  btn.dataset.switchId = f.id;
  btn.setAttribute('role', 'switch');
  btn.textContent = f.short ?? f.title;
  const tip = `${f.title}：${f.desc}`;
  btn.title = tip;
  btn.setAttribute('aria-label', tip);
  btn.setAttribute('aria-checked', String(shownOf(f, ctx)));
  btn.addEventListener('click', () => {
    // 点暗=隐藏：新 hide 值等于点击前的亮态
    ctx.onToggle(f.id, btn.getAttribute('aria-checked') === 'true');
  });
  return btn;
}

function toggleControl(f: Switch, ctx: RenderContext): HTMLInputElement {
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  toggle.className = 'toggle';
  toggle.checked = shownOf(f, ctx);
  toggle.addEventListener('change', () => ctx.onToggle(f.id, !toggle.checked));
  return toggle;
}

/** 两态文字切换（如小字/大字）：语义直接写在按钮上，不依赖「开=拿走」约定 */
function segControl(f: Switch, ctx: RenderContext): HTMLElement {
  const seg = f.segments!;
  const on = isActive(f, ctx.state.overrides, ctx.page);
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
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(on === value));
    btn.addEventListener('click', () => {
      if (isActive(f, ctx.state.overrides, ctx.page) !== value) ctx.onToggle(f.id, value);
    });
    wrap.append(btn);
  }
  return wrap;
}

/** 数值项：滑块即时写回 params，上限挡位由 CSS 自然等价于不限制 */
function rangeControl(f: Switch, ctx: RenderContext): HTMLElement {
  const spec = f.range!;
  const wrap = document.createElement('span');
  wrap.className = 'range';

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'range-input';
  input.min = String(spec.min);
  input.max = String(spec.max);
  input.step = String(spec.step);
  const current = rangeValue(f, ctx.state.params) ?? spec.default;
  input.value = String(current);
  const tip = `${f.title}：${f.desc}`;
  input.title = tip;
  input.setAttribute('aria-label', tip);
  input.setAttribute('aria-valuetext', `${current}${spec.unit}`);
  input.addEventListener('input', () => ctx.onParam(f.id, Number(input.value)));
  // 松手立即写权威值；拖动中的 input 只走节流
  input.addEventListener('change', () => ctx.onParam(f.id, Number(input.value), true));

  const value = document.createElement('output');
  value.className = 'range-val';
  value.textContent = `${current}${spec.unit}`;

  wrap.append(input, value);
  return wrap;
}

function rowEl(f: Switch, nested: boolean, ctx: RenderContext): HTMLElement {
  // label 会把行内点击转发给第一个可标记控件（button 也算），两态/数值行改用 div 避免误触
  const el = document.createElement(f.segments || f.range ? 'div' : 'label');
  el.className = nested ? 'row nested' : 'row';
  el.dataset.switchId = f.id;

  const info = document.createElement('span');
  info.className = 'info';
  const line1 = document.createElement('span');
  line1.className = 'line1';
  const title = document.createElement('b');
  title.textContent = f.title;
  line1.append(title);

  if (f.suppressedBy) {
    const badge = document.createElement('i');
    badge.className = 'badge takeover';
    badge.textContent = '已接管';
    badge.hidden = true;
    line1.append(badge);
  }

  const desc = document.createElement('span');
  desc.className = 'desc';
  desc.textContent = f.desc;
  info.append(line1, desc);

  if (!isGlobalSwitch(f)) {
    const others = PAGES.filter((p) => p.id !== ctx.page && f.pages.includes(p.id));
    if (others.length) {
      const scope = document.createElement('span');
      scope.className = 'scope';
      scope.textContent = `也作用于 ${others.map((p) => p.label).join(' · ')}`;
      info.append(scope);
    }
  }

  const hits = document.createElement('span');
  hits.className = 'hits';
  hits.dataset.id = f.id;
  hits.hidden = true;

  const control = f.range
    ? rangeControl(f, ctx)
    : f.segments
      ? segControl(f, ctx)
      : toggleControl(f, ctx);
  el.append(info, hits, control);
  return el;
}

function renderTree(
  f: Switch,
  items: Switch[],
  target: HTMLElement,
  nested: boolean,
  ctx: RenderContext,
): void {
  target.append(rowEl(f, nested, ctx));
  const children = items.filter((x) => x.suppressedBy === f.id);
  if (!children.length) return;
  const childWrap = document.createElement('div');
  childWrap.className = 'children';
  for (const child of children) renderTree(child, items, childWrap, true, ctx);
  target.append(childWrap);
}

export function renderPanel(
  container: HTMLElement,
  list: Switch[],
  kind: PanelKind,
  state: PanelState,
  onToggle: ToggleHandler,
  onParam: RangeHandler,
): void {
  const ctx: RenderContext = { state, page: effectivePage(kind, state), onToggle, onParam };
  container.textContent = '';

  for (const region of REGION_ORDER) {
    const items = list.filter((f) => f.region === region);
    if (!items.length) continue;

    const { details, body } = groupEl(region, `${kind}:${region}`, items.length);
    if (region === 'header') {
      const note = document.createElement('p');
      note.className = 'group-note';
      note.textContent = '点亮表示入口正在显示，点暗即隐藏';
      const chips = document.createElement('div');
      chips.className = 'chips';
      for (const f of items) chips.append(chipEl(f, ctx));
      body.append(note, chips);
    } else {
      const rows = document.createElement('div');
      rows.className = 'rows';
      const shown = new Set(items.map((f) => f.id));
      for (const f of items.filter((x) => !x.suppressedBy || !shown.has(x.suppressedBy))) {
        renderTree(f, items, rows, false, ctx);
      }
      body.append(rows);
    }
    container.append(details);
  }
}

/** 把已渲染的开关树同步到当前 overrides 与页面；只改状态，不重建 DOM */
export function refreshPanel(panel: HTMLElement, kind: PanelKind, state: PanelState): void {
  const page = effectivePage(kind, state);

  for (const el of panel.querySelectorAll<HTMLElement>('[data-switch-id]')) {
    const f = SWITCHES_BY_ID.get(el.dataset.switchId ?? '');
    if (!f) continue;
    const suppressor = suppressorOf(f, state.overrides, page);
    const active = isActive(f, state.overrides, page);

    if (el.classList.contains('chipbtn')) {
      el.setAttribute('aria-checked', String(!active));
      (el as HTMLButtonElement).disabled = suppressor !== null;
      el.classList.toggle('off', suppressor !== null);
      continue;
    }

    const toggle = el.querySelector<HTMLInputElement>('.toggle');
    if (toggle) {
      toggle.checked = !active;
      toggle.disabled = suppressor !== null;
    }
    const seg = el.querySelector<HTMLElement>('.seg');
    if (seg) {
      for (const [index, btn] of [...seg.querySelectorAll<HTMLButtonElement>('.seg-opt')].entries()) {
        btn.setAttribute('aria-checked', String(active === (index === 1)));
        btn.disabled = suppressor !== null;
      }
    }
    const range = el.querySelector<HTMLInputElement>('.range-input');
    if (range && f.range) {
      const value = rangeValue(f, state.params) ?? f.range.default;
      range.value = String(value);
      range.disabled = suppressor !== null;
      range.setAttribute('aria-valuetext', `${value}${f.range.unit}`);
      const out = el.querySelector<HTMLOutputElement>('.range-val');
      if (out) out.textContent = `${value}${f.range.unit}`;
    }
    const takeover = el.querySelector<HTMLElement>('.takeover');
    if (takeover) {
      takeover.hidden = suppressor === null;
      takeover.title = suppressor ? `已由「${suppressor.title}」接管` : '';
    }
    el.classList.toggle('off', suppressor !== null);

    const hits = el.querySelector<HTMLElement>('.hits');
    if (hits) {
      const show =
        suppressor === null &&
        state.currentPage !== 'other' &&
        (kind === 'global' || state.selectedPage === state.currentPage);
      hits.hidden = !show;
      if (!show) {
        hits.textContent = '';
        hits.classList.remove('has');
        hits.removeAttribute('title');
      }
    }
  }

  refreshGroups(panel, kind, state, page);
}

function refreshGroups(
  panel: HTMLElement,
  kind: PanelKind,
  state: PanelState,
  page: PageType,
): void {
  for (const details of panel.querySelectorAll<HTMLDetailsElement>('.group')) {
    const items = [...details.querySelectorAll<HTMLElement>('[data-switch-id]')];
    let active = 0;
    let total = 0;
    let suppressor: Switch | null = null;
    for (const el of items) {
      const f = SWITCHES_BY_ID.get(el.dataset.switchId ?? '');
      if (!f) continue;
      if (isHideLike(f)) {
        total++;
        if (isActive(f, state.overrides, page)) active++;
      }
      if (!suppressor) suppressor = suppressorOf(f, state.overrides, page);
    }

    const count = details.querySelector<HTMLElement>('.group-count');
    if (count) {
      // 整组只有调节项时不显示「已隐藏」徽标，避免出现无意义的空计数
      count.hidden = total === 0;
      count.textContent = total ? `${active}/${total}` : '';
      count.title = total ? `已隐藏 ${active} 项，共 ${total} 项` : '';
    }

    const hint = details.querySelector<HTMLElement>('.hint');
    if (!hint) continue;
    if (suppressor) {
      const cross = kind === 'page' && isGlobalSwitch(suppressor);
      hint.textContent = cross
        ? `「${suppressor.title}」已接管以下子项，可在左侧「${REGION_TITLES[suppressor.region]}」中关闭总开关。`
        : `部分子项已被「${suppressor.title}」接管，关闭总开关后可单独调整。`;
      hint.hidden = false;
    } else {
      hint.hidden = true;
      hint.textContent = '';
    }
  }
}
