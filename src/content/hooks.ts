/**
 * 页面取内容数据的 hooks。页面只用这些 hooks，不直接碰 repository，
 * 这样以后换成云端（有网络延迟、可能失败）时，loading / error 状态已经有了。
 */
import { useEffect, useState } from 'react';

import type { LocalDate } from '@/logic/date';

import { contentRepository } from './index';
import type { Article, Series } from './types';

export interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/** 通用：执行一个异步读取，依赖变化时重新读 */
function useQuery<T>(load: () => Promise<T>, key: string): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, loading: true, error: undefined });

  useEffect(() => {
    let cancelled = false; // 页面切走后结果回来也不再 setState
    setState((s) => ({ ...s, loading: true, error: undefined }));
    load().then(
      (data) => !cancelled && setState({ data, loading: false, error: undefined }),
      (error: unknown) =>
        !cancelled && setState({ data: undefined, loading: false, error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      cancelled = true;
    };
    // key 已经包含了所有参数；load 每次渲染都是新函数，所以不放进依赖
  }, [key]);

  return state;
}

/** 能看到的文章（已发布；预览模式下包括未发布），新的在前 */
export function usePublishedArticles(today: LocalDate, includeUnpublished: boolean): QueryState<Article[]> {
  return useQuery(
    () => contentRepository.getPublishedArticles({ today, includeUnpublished }),
    `published:${today}:${includeUnpublished}`,
  );
}

/** 某篇文章（不管是否发布） */
export function useArticle(id: string | undefined): QueryState<Article | undefined> {
  return useQuery(() => (id ? contentRepository.getArticle(id) : Promise.resolve(undefined)), `article:${id}`);
}

/** 全部系列 */
export function useAllSeries(): QueryState<Series[]> {
  return useQuery(() => contentRepository.getAllSeries(), 'series:all');
}

/** 某个系列 */
export function useSeries(id: string | undefined): QueryState<Series | undefined> {
  return useQuery(() => (id ? contentRepository.getSeries(id) : Promise.resolve(undefined)), `series:${id}`);
}
