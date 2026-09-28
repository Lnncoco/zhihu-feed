import { describe, expect, it } from 'vitest';
import { sanitizeOverrides } from '@/settings';

describe('sanitizeOverrides', () => {
  it('保留注册在案的布尔键', () => {
    const out = sanitizeOverrides({ 'hide-ads': false, 'hide-logo': true });
    expect(out).toEqual({ 'hide-ads': false, 'hide-logo': true });
  });

  it('丢弃未注册键与非布尔值（旧开关键不写回残留）', () => {
    const out = sanitizeOverrides({
      'hide-ads': 'yes',
      'removed-feature': true,
    });
    expect(out).toEqual({});
  });

  it('非对象输入返回空', () => {
    expect(sanitizeOverrides(null)).toEqual({});
    expect(sanitizeOverrides(undefined)).toEqual({});
    expect(sanitizeOverrides('str')).toEqual({});
    expect(sanitizeOverrides(42)).toEqual({});
  });
});
