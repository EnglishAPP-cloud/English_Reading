/**
 * 发布规则：publishAt（本地日期）晚于今天的文章不显示。
 * 开发环境可以打开"预览未发布内容"，这时全部显示。
 */
import { compareDates, type LocalDate } from './date';

type Publishable = { id: string; publishAt: LocalDate };

/** 这篇文章今天是否已发布（publishAt ≤ 今天） */
export function isPublished(article: Publishable, today: LocalDate): boolean {
  return compareDates(article.publishAt, today) <= 0;
}

/** 按"是否已发布 / 是否预览"过滤出能看到的文章 */
export function visibleArticles<T extends Publishable>(
  articles: readonly T[],
  today: LocalDate,
  includeUnpublished: boolean,
): T[] {
  return includeUnpublished ? [...articles] : articles.filter((a) => isPublished(a, today));
}

/** 新的在前：publishAt 晚的在前，同一天按 id 字母顺序 */
export function sortNewestFirst<T extends Publishable>(articles: readonly T[]): T[] {
  return [...articles].sort((a, b) => compareDates(b.publishAt, a.publishAt) || a.id.localeCompare(b.id));
}
