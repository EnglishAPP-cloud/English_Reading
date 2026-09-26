/**
 * 日期工具：所有日期都按"本地时区的 YYYY-MM-DD 字符串"处理，不引入日期库。
 *
 * 为什么用字符串：
 * - 存储和比较都简单：同格式的 YYYY-MM-DD 直接按字符串比大小就是按日期比大小
 * - 不会被时区搞乱：只关心"本地的哪一天"，不关心几点几分
 */

/** 本地日期，格式 YYYY-MM-DD，例如 '2026-09-25' */
export type LocalDate = string;

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** 把一个时刻转成它在本地时区的日期 */
export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 今天（本地时区）。offsetDays 用于开发时"模拟日期"，正常为 0 */
export function todayLocal(now: Date = new Date(), offsetDays = 0): LocalDate {
  return addDays(toLocalDate(now), offsetDays);
}

/** 拆出年月日；格式不对返回 null */
function parts(date: string): [number, number, number] | null {
  const m = PATTERN.exec(date);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** 是不是合法的 YYYY-MM-DD（会检查 2 月 30 日这种不存在的日期） */
export function isValidLocalDate(date: string): boolean {
  const p = parts(date);
  if (!p) return false;
  const [y, m, d] = p;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function mustParts(date: LocalDate): [number, number, number] {
  const p = parts(date);
  if (!p || !isValidLocalDate(date)) throw new Error(`不是合法日期：${date}`);
  return p;
}

/** 日期加减天数（n 可以是负数） */
export function addDays(date: LocalDate, n: number): LocalDate {
  const [y, m, d] = mustParts(date);
  // 用本地时间的"年、月、日"构造，Date 会自动处理跨月跨年；中午 12 点避开夏令时切换
  return toLocalDate(new Date(y, m - 1, d + n, 12));
}

/** 比较两个日期：a 早于 b 返回负数，相同返回 0，晚于返回正数 */
export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 显示用：'2026-09-25' → '9月25日' */
export function formatMonthDay(date: LocalDate): string {
  const [, m, d] = mustParts(date);
  return `${m}月${d}日`;
}
