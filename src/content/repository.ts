/**
 * 内容数据的访问接口。页面和 hooks 只认这个接口，不关心数据从哪来。
 *
 * - 现在：LocalContentRepository，读打包进 APP 的 JSON
 * - 以后：比如 CloudBaseContentRepository，从腾讯云读；只需新写一个实现，
 *   然后在 src/content/index.ts 里换掉导出的实例，页面代码不用动
 *
 * 所有方法都是异步的（返回 Promise），这样换成网络请求时签名不用变。
 */
import type { LocalDate } from '@/logic/date';

import type { Article, Series } from './types';

export interface PublishedQuery {
  /** 今天（本地日期），publishAt 晚于它的文章不返回 */
  today: LocalDate;
  /** 开发用：为 true 时连未发布的也返回 */
  includeUnpublished: boolean;
}

export interface ContentRepository {
  /** 全部系列 */
  getAllSeries(): Promise<Series[]>;
  /** 某个系列；不存在返回 undefined */
  getSeries(id: string): Promise<Series | undefined>;
  /** 能看到的文章，新的在前（publishAt 晚的在前，同一天按 id） */
  getPublishedArticles(query: PublishedQuery): Promise<Article[]>;
  /** 某篇文章，不管是否发布（收藏详情、只读原文要用）；不存在返回 undefined */
  getArticle(id: string): Promise<Article | undefined>;
}
