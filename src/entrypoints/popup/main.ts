// 面板入口：只负责状态与编排。开关语义在 @/switches/resolve，持久化在 @/settings，
// 开关树渲染/同步在 panel.ts，命中数在 counts.ts——本文件不写级联判断或存储细节。
import { SWITCHES, isGlobalSwitch } from '@/switches';
import { isActive } from '@/switches/resolve';
import { getOverrides, setOverrides } from '@/settings';
import { PAGES, pageOfUrl, type PageType } from '@/pages';
import { loadCounts } from './counts';
import { effectivePage, refreshPanel, renderPanel, type PanelState } from './panel';

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const currentPage: PageType | 'other' = tab?.url ? pageOfUrl(tab.url) : 'other';
const state: PanelState = {
  overrides: {},
  currentPage,
  selectedPage: currentPage === 'other' ? 'home' : currentPage,
};

const globalSwitches = SWITCHES.filter(isGlobalSwitch);
const pageSwitches = (page: PageType) =>
  SWITCHES.filter((f) => !isGlobalSwitch(f) && f.pages.includes(page));

const globalPanel = document.querySelector<HTMLElement>('#global-panel')!;
const pagePanel = document.querySelector<HTMLElement>('#page-panel')!;
const pageSelect = document.querySelector<HTMLSelectElement>('#page-select')!;
const pageNote = document.querySelector<HTMLElement>('#page-note')!;
const currentChip = document.querySelector<HTMLElement>('#current-chip')!;
const globalCount = document.querySelector<HTMLElement>('#global-count')!;

function pageLabel(page: PageType): string {
  return PAGES.find((p) => p.id === page)?.label ?? '';
}

function setHeader(): void {
  currentChip.textContent =
    state.currentPage === 'other' ? '非知乎页面' : `当前：${pageLabel(state.currentPage)}`;
  currentChip.classList.toggle('warn', state.currentPage === 'other');
}

function buildPageSelect(): void {
  pageSelect.textContent = '';
  for (const page of PAGES) {
    const option = document.createElement('option');
    option.value = page.id;
    option.textContent =
      page.id === state.currentPage ? `${page.label}（当前）` : page.label;
    pageSelect.append(option);
  }
  pageSelect.value = state.selectedPage;
}

function refreshPageNote(): void {
  if (state.currentPage === 'other') {
    pageNote.textContent = '当前不是知乎页面，命中数不可用';
    pageNote.hidden = false;
  } else if (state.selectedPage !== state.currentPage) {
    pageNote.textContent = `非当前页（正在浏览：${pageLabel(state.currentPage)}），不显示命中数`;
    pageNote.hidden = false;
  } else {
    pageNote.hidden = true;
    pageNote.textContent = '';
  }
}

function refresh(): void {
  refreshPanel(globalPanel, 'global', state);
  refreshPanel(pagePanel, 'page', state);

  const active = globalSwitches.filter((f) =>
    isActive(f, state.overrides, effectivePage('global', state)),
  ).length;
  globalCount.textContent = `${active}/${globalSwitches.length}`;
  globalCount.title = `全站通用已隐藏 ${active} 项，共 ${globalSwitches.length} 项`;

  refreshPageNote();
}

function renderPage(): void {
  renderPanel(pagePanel, pageSwitches(state.selectedPage), 'page', state, commit);
}

function reloadCounts(): void {
  if (state.currentPage === 'other') return;
  void loadCounts(tab?.id);
}

function commit(id: string, value: boolean): void {
  state.overrides[id] = value;
  setOverrides(state.overrides);
  refresh();
  reloadCounts();
}

pageSelect.addEventListener('change', () => {
  state.selectedPage = pageSelect.value as PageType;
  renderPage();
  refresh();
  if (state.selectedPage === state.currentPage) reloadCounts();
});

setHeader();
buildPageSelect();
state.overrides = await getOverrides();
renderPanel(globalPanel, globalSwitches, 'global', state, commit);
renderPage();
refresh();
reloadCounts();
