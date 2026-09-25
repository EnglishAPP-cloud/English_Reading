import {
  addDays,
  compareDates,
  diffDays,
  formatMonthDay,
  isValidLocalDate,
  toLocalDate,
  todayLocal,
} from '@/logic/date';

describe('日期工具', () => {
  it('toLocalDate 取本地时区的年月日（深夜也不会跑到第二天）', () => {
    expect(toLocalDate(new Date(2026, 8, 25, 0, 0))).toBe('2026-09-25');
    expect(toLocalDate(new Date(2026, 8, 25, 23, 59))).toBe('2026-09-25');
    expect(toLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('todayLocal 支持模拟日期偏移', () => {
    const now = new Date(2026, 8, 25, 10);
    expect(todayLocal(now)).toBe('2026-09-25');
    expect(todayLocal(now, 1)).toBe('2026-09-26');
    expect(todayLocal(now, -30)).toBe('2026-08-26');
  });

  it('isValidLocalDate 检查格式和日期是否真实存在', () => {
    expect(isValidLocalDate('2026-09-25')).toBe(true);
    expect(isValidLocalDate('2028-02-29')).toBe(true); // 闰年
    expect(isValidLocalDate('2026-02-29')).toBe(false);
    expect(isValidLocalDate('2026-02-30')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2026-9-25')).toBe(false);
    expect(isValidLocalDate('')).toBe(false);
  });

  it('addDays 能跨月、跨年、倒退', () => {
    expect(addDays('2026-09-25', 1)).toBe('2026-09-26');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-09-25', 30)).toBe('2026-10-25');
    expect(addDays('2026-09-25', 0)).toBe('2026-09-25');
  });

  it('addDays 遇到非法日期直接报错', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow();
  });

  it('diffDays 计算相差天数', () => {
    expect(diffDays('2026-09-25', '2026-09-26')).toBe(1);
    expect(diffDays('2026-09-26', '2026-09-25')).toBe(-1);
    expect(diffDays('2026-12-31', '2027-01-01')).toBe(1);
    expect(diffDays('2026-01-01', '2027-01-01')).toBe(365);
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2); // 夏令时附近也按整天算
  });

  it('compareDates 按日期先后比较', () => {
    expect(compareDates('2026-09-25', '2026-09-26')).toBeLessThan(0);
    expect(compareDates('2026-09-26', '2026-09-25')).toBeGreaterThan(0);
    expect(compareDates('2026-09-25', '2026-09-25')).toBe(0);
    expect(compareDates('2026-10-01', '2026-09-30')).toBeGreaterThan(0);
  });

  it('formatMonthDay 显示为 x月x日', () => {
    expect(formatMonthDay('2026-09-05')).toBe('9月5日');
  });
});
