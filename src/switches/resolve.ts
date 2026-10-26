// 开关生效语义的唯一实现（default + 用户覆盖 + suppressedBy 级联）。
// content script 与 popup 都必须经由这里判断，禁止本地重写级联规则，
// 否则「面板显示」与「实际生效」会漂移。
import { SWITCHES, SWITCHES_BY_ID, type Switch } from '@/switches';
import type { PageType } from '@/pages';
import type { Overrides, Params } from '@/settings';

/** 接管本开关且在本页生效的最外层父开关；无则 null。 */
export function suppressorOf(s: Switch, overrides: Overrides, page: PageType): Switch | null {
  let parentId = s.suppressedBy;
  let suppressor: Switch | null = null;
  const seen = new Set([s.id]);

  while (parentId) {
    if (seen.has(parentId)) return null;
    seen.add(parentId);
    const parent = SWITCHES_BY_ID.get(parentId);
    if (!parent || !parent.pages.includes(page)) return null;
    if (!(overrides[parent.id] ?? parent.default)) return null;
    suppressor = parent;
    parentId = parent.suppressedBy;
  }
  return suppressor;
}

/** 本开关在该页是否真正生效（考虑用户覆盖、默认值与父级联） */
export function isActive(s: Switch, overrides: Overrides, page: PageType): boolean {
  if (!(overrides[s.id] ?? s.default)) return false;
  return suppressorOf(s, overrides, page) === null;
}

/** 该页全部生效开关（content script 挂属性用） */
export function activeOnPage(overrides: Overrides, page: PageType): Switch[] {
  return SWITCHES.filter((s) => s.pages.includes(page) && isActive(s, overrides, page));
}

/** 数值项的有效值：用户值优先，缺省回注册表默认；非数值项返回 null */
export function rangeValue(s: Switch, params: Params): number | null {
  return s.range ? (params[s.id] ?? s.range.default) : null;
}
