/**
 * 从 store 里取"算出来的"数据的 hooks。
 *
 * 注意：zustand 的 selector 不能每次返回新数组 / 新对象（会导致无限重渲染），
 * 所以这里先取原始数据，再用 useMemo 计算。
 */
import { useEffect, useMemo, useState } from 'react';

import type { LocalDate } from '@/logic/date';
import { splitByMastery, type Favorite } from '@/logic/favorites';
import type { ArticleProgress } from '@/logic/flow';
import { dueItems } from '@/logic/review';
import { currentStreak } from '@/logic/streak';

import { useUserStore } from './userStore';

/** 某篇文章的进度（没开始过返回 undefined） */
export function useArticleProgress(articleId: string | undefined): ArticleProgress | undefined {
  return useUserStore((s) => (articleId ? s.progress[articleId] : undefined));
}

/** 今天要复习的收藏（已排好序） */
export function useDueFavorites(today: LocalDate): Favorite[] {
  const favorites = useUserStore((s) => s.favorites);
  return useMemo(() => dueItems(Object.values(favorites), today), [favorites, today]);
}

/** 单词页：学习中 / 已掌握 */
export function useFavoritesByMastery(): { learning: Favorite[]; mastered: Favorite[] } {
  const favorites = useUserStore((s) => s.favorites);
  return useMemo(() => splitByMastery(favorites), [favorites]);
}

/** 连续打卡天数 */
export function useStreak(today: LocalDate): number {
  const checkIns = useUserStore((s) => s.checkIns);
  return useMemo(() => currentStreak(checkIns, today), [checkIns, today]);
}

/** 本地存储里的数据读回来了没有。没读回来之前不要渲染页面，否则会先显示空进度 */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useUserStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useUserStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
