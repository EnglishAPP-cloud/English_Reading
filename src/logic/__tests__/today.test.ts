import { pickTodayArticle } from '@/logic/today';

const a = (id: string, publishAt: string) => ({ id, publishAt });

describe('今日选文', () => {
  const list = [a('old', '2026-09-18'), a('new', '2026-09-25'), a('mid', '2026-09-21')];

  it('选还没读完的里面最新的一篇', () => {
    expect(pickTodayArticle(list, {})?.id).toBe('new');
  });

  it('最新的读完了，就选次新的', () => {
    expect(pickTodayArticle(list, { new: { completedAt: 'x' } })?.id).toBe('mid');
  });

  it('读到一半的不算读完', () => {
    expect(pickTodayArticle(list, { new: {} })?.id).toBe('new');
  });

  it('全部读完返回 undefined', () => {
    const all = { old: { completedAt: 'x' }, new: { completedAt: 'x' }, mid: { completedAt: 'x' } };
    expect(pickTodayArticle(list, all)).toBeUndefined();
  });

  it('同一天多篇按 id 排序取第一篇', () => {
    expect(pickTodayArticle([a('b-2', '2026-09-25'), a('a-1', '2026-09-25')], {})?.id).toBe('a-1');
  });

  it('没有文章返回 undefined', () => {
    expect(pickTodayArticle([], {})).toBeUndefined();
  });
});
