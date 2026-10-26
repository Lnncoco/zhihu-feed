import { describe, expect, it } from 'vitest';
import { sanitizeOverrides, sanitizeParams } from '@/settings';

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

  it('数值项不进入布尔层', () => {
    expect(sanitizeOverrides({ 'limit-image-width': 320, 'hide-ads': true })).toEqual({
      'hide-ads': true,
    });
  });

  it('非对象输入返回空', () => {
    expect(sanitizeOverrides(null)).toEqual({});
    expect(sanitizeOverrides(undefined)).toEqual({});
    expect(sanitizeOverrides('str')).toEqual({});
    expect(sanitizeOverrides(42)).toEqual({});
  });
});

describe('sanitizeParams', () => {
  it('保留注册的数值键，并按 step 收敛', () => {
    expect(sanitizeParams({ 'limit-image-width': 320 })).toEqual({ 'limit-image-width': 320 });
    expect(sanitizeParams({ 'limit-image-width': 333 })).toEqual({ 'limit-image-width': 340 });
    expect(sanitizeParams({ 'limit-image-width': 313 })).toEqual({ 'limit-image-width': 320 });
  });

  it('越界值收敛到 min/max', () => {
    expect(sanitizeParams({ 'limit-image-width': 0 })).toEqual({ 'limit-image-width': 160 });
    expect(sanitizeParams({ 'limit-image-width': 1000 })).toEqual({ 'limit-image-width': 720 });
  });

  it('旧百分比键不进入新单位参数层', () => {
    expect(sanitizeParams({ 'limit-images': 40 })).toEqual({});
  });

  it('丢弃未知键与非有限数值', () => {
    expect(sanitizeParams({ 'limit-image-width': '320', unknown: 10 })).toEqual({});
    expect(sanitizeParams({ 'limit-image-width': Number.NaN })).toEqual({});
    expect(sanitizeParams({ 'limit-image-width': Infinity })).toEqual({});
    expect(sanitizeParams(null)).toEqual({});
    expect(sanitizeParams(undefined)).toEqual({});
  });
});
