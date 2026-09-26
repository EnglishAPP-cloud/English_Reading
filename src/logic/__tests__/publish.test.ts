import { isPublished, sortNewestFirst, visibleArticles } from '@/logic/publish';

const a = (id: string, publishAt: string) => ({ id, publishAt });

describe('发布规则', () => {
  it('publishAt 早于或等于今天算已发布，晚于今天不算', () => {
    expect(isPublished(a('x', '2026-09-24'), '2026-09-25')).toBe(true);
    expect(isPublished(a('x', '2026-09-25'), '2026-09-25')).toBe(true);
    expect(isPublished(a('x', '2026-09-26'), '2026-09-25')).toBe(false);
  });

  it('visibleArticles 过滤掉未发布的；打开预览后全部显示', () => {
    const list = [a('old', '2026-09-01'), a('today', '2026-09-25'), a('future', '2026-09-26')];
    expect(visibleArticles(list, '2026-09-25', false).map((x) => x.id)).toEqual(['old', 'today']);
    expect(visibleArticles(list, '2026-09-25', true).map((x) => x.id)).toEqual(['old', 'today', 'future']);
  });

  it('sortNewestFirst：发布晚的在前，同一天按 id', () => {
    const list = [a('b', '2026-09-20'), a('c', '2026-09-25'), a('a', '2026-09-20')];
    expect(sortNewestFirst(list).map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('sortNewestFirst 不改原数组', () => {
    const list = [a('b', '2026-09-20'), a('c', '2026-09-25')];
    sortNewestFirst(list);
    expect(list.map((x) => x.id)).toEqual(['b', 'c']);
  });
});
