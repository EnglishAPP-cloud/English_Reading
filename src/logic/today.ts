/**
 * 今日页选文：已发布、还没读完的文章里最新的一篇
 * （publishAt 最晚的；同一天多篇按 id 排序取第一篇）。
 * 全部读完返回 undefined，页面显示"去复习 N 个"。
 */
import type { LocalDate } from './date';
import { sortNewestFirst } from './publish';

export function pickTodayArticle<T extends { id: string; publishAt: LocalDate }>(
  visibleArticles: readonly T[],
  progress: Readonly<Record<string, { completedAt?: string } | undefined>>,
): T | undefined {
  return sortNewestFirst(visibleArticles).find((a) => !progress[a.id]?.completedAt);
}
