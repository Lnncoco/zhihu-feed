import { describe, expect, it } from 'vitest';
import { PAGES, pageOfPathname, pageOfUrl } from '@/pages';

describe('pageOfPathname', () => {
  it('识别五类页面', () => {
    expect(pageOfPathname('/')).toBe('home');
    expect(pageOfPathname('')).toBe('home');
    expect(pageOfPathname('/question/39942538')).toBe('question');
    expect(pageOfPathname('/question/39942538/answer/1234567')).toBe('answer');
    expect(pageOfPathname('/p/123456')).toBe('column');
    expect(pageOfPathname('/hot')).toBe('hot');
    expect(pageOfPathname('/hot/')).toBe('hot');
  });

  it('非信息页面与其他路径判为 other', () => {
    expect(pageOfPathname('/topic')).toBe('other');
    expect(pageOfPathname('/follow')).toBe('other');
    expect(pageOfPathname('/question/abc')).toBe('other');
    expect(pageOfPathname('/p/abc')).toBe('other');
  });

  it('/hot 精确段匹配，前缀撞车路径判 other（2026-09-28 定案）', () => {
    expect(pageOfPathname('/hotlist')).toBe('other');
    expect(pageOfPathname('/hot-search')).toBe('other');
  });
});

describe('pageOfUrl', () => {
  it('只认知乎域名', () => {
    expect(pageOfUrl('https://www.zhihu.com/question/1')).toBe('question');
    expect(pageOfUrl('https://zhuanlan.zhihu.com/p/123')).toBe('column');
    expect(pageOfUrl('https://zhihu.com/')).toBe('home');
    expect(pageOfUrl('https://notzhihu.com/question/1')).toBe('other');
    expect(pageOfUrl('https://evil.com/#https://www.zhihu.com/')).toBe('other');
    expect(pageOfUrl('not-a-url')).toBe('other');
  });
});

describe('PAGES 元数据', () => {
  it('5 个页面、id 唯一、与 PageType 对齐', () => {
    const ids = PAGES.map((p) => p.id);
    expect(ids).toEqual(['home', 'question', 'answer', 'hot', 'column']);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PAGES) expect(p.label.length).toBeGreaterThan(0);
  });
});
