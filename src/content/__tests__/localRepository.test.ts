import { LocalContentRepository } from '../localRepository';

import { sampleArticle, sampleSeries } from './fixtures';

describe('LocalContentRepository', () => {
  const a1 = sampleArticle(); // publishAt 2026-09-25
  const a2 = { ...sampleArticle(), id: 'news-01', publishAt: '2026-09-28' };
  delete (a2 as { seriesId?: string }).seriesId;
  delete (a2 as { seriesIndex?: number }).seriesIndex;
  const repo = new LocalContentRepository([a1, a2], [sampleSeries()]);

  it('按发布日期过滤，新的在前', async () => {
    const ids = async (today: string, includeUnpublished = false) =>
      (await repo.getPublishedArticles({ today, includeUnpublished })).map((a) => a.id);
    expect(await ids('2026-09-24')).toEqual([]);
    expect(await ids('2026-09-25')).toEqual(['hkp-01']);
    expect(await ids('2026-09-28')).toEqual(['news-01', 'hkp-01']);
    expect(await ids('2026-09-24', true)).toEqual(['news-01', 'hkp-01']);
  });

  it('getArticle 不管是否发布都能取到', async () => {
    expect((await repo.getArticle('news-01'))?.id).toBe('news-01');
    expect(await repo.getArticle('nope')).toBeUndefined();
  });

  it('getSeries / getAllSeries', async () => {
    expect((await repo.getSeries('how-to-know-a-person'))?.total).toBe(5);
    expect(await repo.getSeries('nope')).toBeUndefined();
    expect(await repo.getAllSeries()).toHaveLength(1);
  });

  it('内容不合法时直接报错（正常情况下脚本已经拦住了）', () => {
    expect(() => new LocalContentRepository([{ id: 'bad' }], [])).toThrow();
  });
});
