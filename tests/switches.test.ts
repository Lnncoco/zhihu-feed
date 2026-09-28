import { describe, expect, it } from 'vitest';
import { PAGES } from '@/pages';
import { REGION_ORDER, SWITCHES, type Region } from '@/switches';
import { activeOnPage, isActive, suppressorOf } from '@/switches/resolve';

const find = (id: string) => SWITCHES.find((s) => s.id === id)!;

describe('isActive / suppressorOf 级联语义', () => {
  it('父在本页默认生效时，子被接管：isActive=false 且能拿到父', () => {
    const child = find('hide-hot-search');
    const parent = find('widen-main-column');
    expect(suppressorOf(child, {}, 'home')?.id).toBe(parent.id);
    expect(isActive(child, {}, 'home')).toBe(false);
  });

  it('用户关掉父后，子复活按自身默认值生效', () => {
    const child = find('hide-hot-search');
    const overrides = { 'widen-main-column': false };
    expect(suppressorOf(child, overrides, 'home')).toBeNull();
    expect(isActive(child, overrides, 'home')).toBe(true);
  });

  it('父接管时用户显式关掉子——子仍不生效（语义一致）', () => {
    expect(isActive(find('hide-hot-search'), { 'hide-hot-search': false }, 'home')).toBe(false);
  });

  it('父不在本页出现时不构成接管（专栏页无 widen-main-column）', () => {
    const child = find('hide-hot-search');
    expect(child.pages).toContain('column');
    expect(find('widen-main-column').pages).not.toContain('column');
    expect(isActive(child, {}, 'column')).toBe(true);
  });

  it('activeOnPage 与逐项 isActive 一致', () => {
    for (const page of PAGES.map((p) => p.id)) {
      const set = new Set(activeOnPage({}, page).map((s) => s.id));
      for (const s of SWITCHES) {
        expect(set.has(s.id)).toBe(s.pages.includes(page) && isActive(s, {}, page));
      }
    }
  });
});

describe('注册表自检', () => {
  const ids = SWITCHES.map((s) => s.id);
  const pages = new Set(PAGES.map((p) => p.id));
  const regions = new Set<Region>(REGION_ORDER);

  it('id 唯一且为 kebab-case', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
  });

  it('suppressedBy 指向存在的开关，且父 title 可用于面板文案', () => {
    for (const s of SWITCHES) {
      if (!s.suppressedBy) continue;
      const parent = SWITCHES.find((x) => x.id === s.suppressedBy);
      expect(parent, `父开关存在: ${s.suppressedBy}`).toBeTruthy();
      // 父子必须至少共享一个页面，否则级联永远不会发生（写了也是死配置）
      expect(parent!.pages.some((p) => s.pages.includes(p))).toBe(true);
      // 子项会在父项所在分区内递归展示，跨区会破坏面板阅读顺序。
      expect(parent!.region).toBe(s.region);
    }
  });

  it('suppressedBy 是无环的树，避免级联解析或面板递归失控', () => {
    for (const s of SWITCHES) {
      const seen = new Set<string>();
      let current = s;
      while (current.suppressedBy) {
        expect(seen.has(current.id), `级联存在环: ${s.id}`).toBe(false);
        seen.add(current.id);
        current = SWITCHES.find((x) => x.id === current.suppressedBy)!;
      }
    }
  });

  it('pages/region/anchors/status 字段合法', () => {
    for (const s of SWITCHES) {
      expect(s.pages.length).toBeGreaterThan(0);
      for (const p of s.pages) expect(pages.has(p)).toBe(true);
      expect(regions.has(s.region)).toBe(true);
      expect(s.anchors.length).toBeGreaterThan(0);
      for (const a of s.anchors) {
        expect(a.selector.trim().length).toBeGreaterThan(0);
        expect(['verified', 'unverified']).toContain(a.status);
      }
    }
  });

  it('标题是名词短语（语义不变式的机检下限：不含动词化前缀）', () => {
    for (const s of SWITCHES) {
      expect(s.title).not.toMatch(/^(取消|精简|开启|关闭|置顶)/);
      expect(s.title.length).toBeGreaterThan(0);
    }
  });
});
