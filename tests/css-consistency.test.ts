import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SWITCHES } from '@/switches';

const css = readFileSync(path.resolve(import.meta.dirname, '../src/styles/content.css'), 'utf8');

function cssSwitchIds(): Set<string> {
  const out = new Set<string>();
  for (const m of css.matchAll(/\[data-zf-([a-z][a-z0-9-]*)\]/g)) out.add(m[1]!);
  return out;
}

function sectionIds(): Set<string> {
  const out = new Set<string>();
  for (const m of css.matchAll(/=====\s+([a-z][a-z0-9-]*)[：:]/g)) out.add(m[1]!);
  return out;
}

describe('注册表 ↔ content.css 一致性', () => {
  const registry = new Set(SWITCHES.map((s) => s.id));

  it('每个注册开关在 CSS 里有门控规则（防 id typo / 忘写样式）', () => {
    const inCss = cssSwitchIds();
    for (const id of registry) {
      expect(inCss.has(id), `[data-zf-${id}] 缺失`).toBe(true);
    }
  });

  it('CSS 里每个 data-zf-* 门控都对应注册开关（防孤儿规则/未注册属性）', () => {
    for (const id of cssSwitchIds()) {
      expect(registry.has(id), `孤儿规则: data-zf-${id}`).toBe(true);
    }
  });

  it('分节注释头的 id 都已注册', () => {
    for (const id of sectionIds()) {
      expect(registry.has(id), `分节头指向未知开关: ${id}`).toBe(true);
    }
  });

  it('数值项的 CSS 变量缺省值与注册表默认值一致（防两处漂移）', () => {
    for (const s of SWITCHES.filter((x) => x.range)) {
      const expected = `var(--zf-${s.id}, ${s.range!.default}${s.range!.unit})`;
      expect(css.includes(expected), `缺少 ${expected}`).toBe(true);
    }
  });

  it('注释定界符配平（防未闭合注释吞规则——历史事故 L3）', () => {
    const opens = (css.match(/\/\*/g) ?? []).length;
    const closes = (css.match(/\*\//g) ?? []).length;
    expect(opens).toBe(closes);
    // 配平且不存在嵌套：非贪婪切片后仍有残留说明有未闭合
    const slices = css.match(/\/\*[\s\S]*?\*\//g) ?? [];
    expect(slices.length).toBe(opens);
  });
});
