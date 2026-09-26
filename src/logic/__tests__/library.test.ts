import { sampleArticle, sampleSeries } from '@/content/__tests__/fixtures';
import { filterByColumn, filterSeriesByColumn, readableArticleId, seriesReadCount } from '@/logic/library';

const series = sampleSeries();
const hkp01 = sampleArticle(); // column thought，属于 how-to-know-a-person
const news = { ...sampleArticle(), id: 'news-01', column: 'news' as const, seriesId: undefined, seriesIndex: undefined };

describe('知识库', () => {
  it('按栏目筛文章', () => {
    expect(filterByColumn([hkp01, news], 'all').map((x) => x.id)).toEqual(['hkp-01', 'news-01']);
    expect(filterByColumn([hkp01, news], 'news').map((x) => x.id)).toEqual(['news-01']);
    expect(filterByColumn([hkp01, news], 'pro')).toEqual([]);
  });

  it('按栏目筛系列：全部都显示；选栏目时只显示含有该栏目文章的系列', () => {
    expect(filterSeriesByColumn([series], [hkp01, news], 'all')).toHaveLength(1);
    expect(filterSeriesByColumn([series], [hkp01, news], 'thought')).toHaveLength(1);
    expect(filterSeriesByColumn([series], [hkp01, news], 'news')).toHaveLength(0);
    // 系列的文章还没发布（不在可见列表里）时，选了栏目就不显示
    expect(filterSeriesByColumn([series], [news], 'thought')).toHaveLength(0);
  });

  it('系列"已读 x / 共 y 期"：x 数已完成的文章，y 用 total', () => {
    expect(seriesReadCount(series, {})).toEqual({ read: 0, total: 5 });
    expect(seriesReadCount(series, { 'hkp-01': {} })).toEqual({ read: 0, total: 5 });
    expect(seriesReadCount(series, { 'hkp-01': { completedAt: 'x' } })).toEqual({ read: 1, total: 5 });
  });

  describe('每一期能不能读', () => {
    const [issue1, issue2] = series.issues;

    it('ready + 有文章 + 文章能看到 → 能读', () => {
      expect(readableArticleId(issue1!, new Set(['hkp-01']))).toBe('hkp-01');
    });

    it('文章未发布（不在可见列表里）→ 即将上线', () => {
      expect(readableArticleId(issue1!, new Set())).toBeUndefined();
    });

    it('status 为 soon → 即将上线', () => {
      expect(readableArticleId(issue2!, new Set(['hkp-01']))).toBeUndefined();
      expect(readableArticleId({ ...issue1!, status: 'soon' }, new Set(['hkp-01']))).toBeUndefined();
    });
  });
});
