/**
 * 间隔复习调度。
 *
 * 等级 0–6，6 = 已掌握。复习间隔按等级：[1, 2, 4, 7, 15, 30] 天。
 * - 新收藏：等级 0，下次复习 = 明天
 * - 记得：等级 +1，下次复习 = 今天 + 新等级对应的天数；到 6 算已掌握，不再出现
 * - 模糊：等级不变，明天再来
 * - 忘了：等级回 0，明天再来
 * 今天要复习的 = 下次复习日期 ≤ 今天、且没掌握的。
 */
import { addDays, compareDates, type LocalDate } from './date';
import { hasCheckedIn } from './streak';

export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30] as const;

/** 到这个等级算已掌握 */
export const MASTERED_LEVEL = REVIEW_INTERVALS.length;

export type ReviewGrade = 'forgot' | 'fuzzy' | 'remember';

export const GRADE_LABELS: Record<ReviewGrade, string> = {
  forgot: '忘了',
  fuzzy: '模糊',
  remember: '记得',
};

/** 每个收藏项都带的复习信息 */
export interface ReviewSchedule {
  reviewLevel: number; // 0–6
  nextReviewDate: LocalDate; // 下次复习日期
  addedAt: LocalDate; // 收藏日期
  lastReviewedAt?: LocalDate; // 上次复习日期
}

/** 等级对应的间隔天数 */
export function intervalForLevel(level: number): number {
  return REVIEW_INTERVALS[Math.max(0, Math.min(level, REVIEW_INTERVALS.length - 1))] ?? 1;
}

/** 新收藏的复习信息 */
export function newSchedule(today: LocalDate): ReviewSchedule {
  return { reviewLevel: 0, nextReviewDate: addDays(today, intervalForLevel(0)), addedAt: today };
}

export function isMastered(s: Pick<ReviewSchedule, 'reviewLevel'>): boolean {
  return s.reviewLevel >= MASTERED_LEVEL;
}

/** 今天该不该复习 */
export function isDue(s: Pick<ReviewSchedule, 'reviewLevel' | 'nextReviewDate'>, today: LocalDate): boolean {
  return !isMastered(s) && compareDates(s.nextReviewDate, today) <= 0;
}

/** 评分后新的复习信息 */
export function applyGrade<T extends ReviewSchedule>(s: T, grade: ReviewGrade, today: LocalDate): T {
  const tomorrow = addDays(today, 1);
  switch (grade) {
    case 'remember': {
      const reviewLevel = Math.min(s.reviewLevel + 1, MASTERED_LEVEL);
      // 已掌握的不会再出现，下次复习日期保持原样即可
      const nextReviewDate = reviewLevel >= MASTERED_LEVEL ? s.nextReviewDate : addDays(today, intervalForLevel(reviewLevel));
      return { ...s, reviewLevel, nextReviewDate, lastReviewedAt: today };
    }
    case 'fuzzy':
      return { ...s, nextReviewDate: tomorrow, lastReviewedAt: today };
    case 'forgot':
      return { ...s, reviewLevel: 0, nextReviewDate: tomorrow, lastReviewedAt: today };
  }
}

type Sortable = ReviewSchedule & { id: string; createdAt: string };

/** 今天要复习的，按"下次复习日期早的在前，同一天按收藏时间先后"排好 */
export function dueItems<T extends Sortable>(items: readonly T[], today: LocalDate): T[] {
  return items
    .filter((x) => isDue(x, today))
    .sort(
      (a, b) =>
        compareDates(a.nextReviewDate, b.nextReviewDate) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
}

/** 今天要复习几个 */
export function countDue(items: readonly Pick<ReviewSchedule, 'reviewLevel' | 'nextReviewDate'>[], today: LocalDate): number {
  return items.filter((x) => isDue(x, today)).length;
}

/** 评分按钮上的小字：这个评分之后多久再见 */
export function gradeHint(s: ReviewSchedule, grade: ReviewGrade, today: LocalDate): string {
  const next = applyGrade(s, grade, today);
  if (isMastered(next)) return '已掌握';
  const days = intervalForLevel(next.reviewLevel);
  if (grade !== 'remember' || days === 1) return '明天再来';
  return `${days} 天后`;
}

export type ReviewOutcome =
  | { kind: 'more-due'; count: number } // 这一轮卡片过完了，但今天还有到期的（比如跨了零点）
  | { kind: 'done'; checkedIn: boolean }; // 今天的都评完了；checkedIn = 今天是否已打卡

/**
 * 复习页一轮卡片过完之后显示什么：按实际数据判断，而不是假设"评完这一轮就一定打卡了"。
 * dueCount 是此刻今天还到期的数量。
 */
export function reviewOutcome(dueCount: number, checkIns: readonly LocalDate[], today: LocalDate): ReviewOutcome {
  if (dueCount > 0) return { kind: 'more-due', count: dueCount };
  return { kind: 'done', checkedIn: hasCheckedIn(checkIns, today) };
}
