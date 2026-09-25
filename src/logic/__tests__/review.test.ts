import {
  applyGrade,
  countDue,
  dueItems,
  gradeHint,
  intervalForLevel,
  isDue,
  isMastered,
  MASTERED_LEVEL,
  newSchedule,
  REVIEW_INTERVALS,
  type ReviewSchedule,
} from '@/logic/review';

const TODAY = '2026-09-25';

const at = (reviewLevel: number, nextReviewDate = TODAY): ReviewSchedule => ({
  reviewLevel,
  nextReviewDate,
  addedAt: '2026-09-01',
});

describe('复习调度', () => {
  it('间隔表是 [1, 2, 4, 7, 15, 30]，等级 6 算已掌握', () => {
    expect(REVIEW_INTERVALS).toEqual([1, 2, 4, 7, 15, 30]);
    expect(MASTERED_LEVEL).toBe(6);
    expect(intervalForLevel(0)).toBe(1);
    expect(intervalForLevel(5)).toBe(30);
  });

  it('新收藏：等级 0，下次复习 = 明天', () => {
    expect(newSchedule(TODAY)).toEqual({ reviewLevel: 0, nextReviewDate: '2026-09-26', addedAt: TODAY });
  });

  it('新收藏今天不用复习，明天要复习', () => {
    const s = newSchedule(TODAY);
    expect(isDue(s, TODAY)).toBe(false);
    expect(isDue(s, '2026-09-26')).toBe(true);
    expect(isDue(s, '2026-09-30')).toBe(true); // 过期没复习的也算
  });

  it.each([
    [0, 1, '2026-09-27'], // 等级 1 → 2 天
    [1, 2, '2026-09-29'], // 等级 2 → 4 天
    [2, 3, '2026-10-02'], // 等级 3 → 7 天
    [3, 4, '2026-10-10'], // 等级 4 → 15 天
    [4, 5, '2026-10-25'], // 等级 5 → 30 天
  ])('记得：等级 %i → %i，下次复习 %s', (from, to, next) => {
    const s = applyGrade(at(from), 'remember', TODAY);
    expect(s.reviewLevel).toBe(to);
    expect(s.nextReviewDate).toBe(next);
    expect(s.lastReviewedAt).toBe(TODAY);
  });

  it('记得：等级 5 → 6，已掌握，以后不再出现', () => {
    const s = applyGrade(at(5), 'remember', TODAY);
    expect(s.reviewLevel).toBe(6);
    expect(isMastered(s)).toBe(true);
    expect(isDue(s, '2027-12-31')).toBe(false);
  });

  it('模糊：等级不变，明天再来', () => {
    const s = applyGrade(at(3), 'fuzzy', TODAY);
    expect(s.reviewLevel).toBe(3);
    expect(s.nextReviewDate).toBe('2026-09-26');
  });

  it('忘了：等级回 0，明天再来', () => {
    const s = applyGrade(at(4), 'forgot', TODAY);
    expect(s.reviewLevel).toBe(0);
    expect(s.nextReviewDate).toBe('2026-09-26');
  });

  it('评分不改其他字段', () => {
    const item = { ...at(1), id: 'word:x', createdAt: 'c' };
    const s = applyGrade(item, 'remember', TODAY);
    expect(s.id).toBe('word:x');
    expect(s.addedAt).toBe('2026-09-01');
  });

  it('今天要复习的 = 下次复习日期 ≤ 今天且没掌握；早的在前，同一天按收藏时间', () => {
    const items = [
      { id: 'a', createdAt: '2026-09-02T00:00:00Z', ...at(1, '2026-09-25') },
      { id: 'b', createdAt: '2026-09-01T00:00:00Z', ...at(1, '2026-09-25') },
      { id: 'c', createdAt: '2026-09-03T00:00:00Z', ...at(0, '2026-09-20') },
      { id: 'd', createdAt: '2026-09-01T00:00:00Z', ...at(0, '2026-09-26') }, // 明天
      { id: 'e', createdAt: '2026-09-01T00:00:00Z', ...at(6, '2026-09-01') }, // 已掌握
    ];
    expect(dueItems(items, TODAY).map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(countDue(items, TODAY)).toBe(3);
  });

  it('评分按钮提示', () => {
    expect(gradeHint(at(0), 'remember', TODAY)).toBe('2 天后');
    expect(gradeHint(at(5), 'remember', TODAY)).toBe('已掌握');
    expect(gradeHint(at(3), 'fuzzy', TODAY)).toBe('明天再来');
    expect(gradeHint(at(3), 'forgot', TODAY)).toBe('明天再来');
  });
});
