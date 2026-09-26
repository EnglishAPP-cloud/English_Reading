import { sortNewestFirst, visibleArticles } from '@/logic/publish';

import type { ContentRepository, PublishedQuery } from './repository';
import { ArticleSchema, SeriesSchema } from './schema';
import type { Article, Series } from './types';

/**
 * 本地实现：读打包进 APP 的 JSON（content/index.ts 由 npm run content 生成）。
 * 构造时再用 zod 解析一遍：正常情况下脚本已经校验过；万一有人跳过脚本，
 * 这里会直接报错，而不是让页面拿到残缺数据。
 */
export class LocalContentRepository implements ContentRepository {
  private readonly articles: Article[];
  private readonly series: Series[];

  constructor(rawArticles: readonly unknown[], rawSeries: readonly unknown[]) {
    this.articles = rawArticles.map((a) => ArticleSchema.parse(a));
    this.series = rawSeries.map((s) => SeriesSchema.parse(s));
  }

  async getAllSeries(): Promise<Series[]> {
    return [...this.series];
  }

  async getSeries(id: string): Promise<Series | undefined> {
    return this.series.find((s) => s.id === id);
  }

  async getPublishedArticles({ today, includeUnpublished }: PublishedQuery): Promise<Article[]> {
    return sortNewestFirst(visibleArticles(this.articles, today, includeUnpublished));
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.find((a) => a.id === id);
  }
}
