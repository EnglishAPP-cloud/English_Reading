/**
 * 知识库和系列详情用到的规则。
 */
import type { Article, Column, Series, SeriesIssue } from '@/content/types';

/** 栏目筛选：'all' = 全部 */
export type ColumnFilter = Column | 'all';

/** 按栏目筛文章 */
export function filterByColumn<T extends Pick<Article, 'column'>>(articles: readonly T[], filter: ColumnFilter): T[] {
  return filter === 'all' ? [...articles] : articles.filter((a) => a.column === filter);
}

/**
 * 按栏目筛系列：选"全部"显示所有系列；选某个栏目时，只显示含有该栏目（能看到的）文章的系列。
 * （系列本身没有栏目字段，所以看它下面的文章。）
 */
export function filterSeriesByColumn(
  series: readonly Series[],
  visibleArticles: readonly Pick<Article, 'column' | 'seriesId'>[],
  filter: ColumnFilter,
): Series[] {
  if (filter === 'all') return [...series];
  return series.filter((s) => visibleArticles.some((a) => a.seriesId === s.id && a.column === filter));
}

/**
 * 某一期现在能不能读：status 为 ready、有 articleId、而且这篇文章能看到（已发布或预览中）。
 * 能读返回 articleId，否则返回 undefined（页面显示"即将上线"）。
 */
export function readableArticleId(issue: SeriesIssue, visibleArticleIds: ReadonlySet<string>): string | undefined {
  if (issue.status !== 'ready' || !issue.articleId) return undefined;
  return visibleArticleIds.has(issue.articleId) ? issue.articleId : undefined;
}

/** 系列卡片的"已读 x / 共 y 期"：x = 这个系列里已完成的文章数，y = 系列的 total */
export function seriesReadCount(
  series: Series,
  progress: Readonly<Record<string, { completedAt?: string } | undefined>>,
): { read: number; total: number } {
  const ids = new Set(series.issues.map((i) => i.articleId).filter((id): id is string => !!id));
  const read = [...ids].filter((id) => !!progress[id]?.completedAt).length;
  return { read, total: series.total };
}
