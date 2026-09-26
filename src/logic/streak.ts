/**
 * 打卡和连续天数。
 *
 * 打卡来源：读完一篇（点"读完了"）、复习完一轮。一天打多次也只算一次。
 * 连续天数：有打卡的日期连成的天数，以今天或昨天结尾才算连续；否则为 0。
 * （以昨天结尾也算：今天还没打卡时，昨天之前的连续记录不会马上清零。）
 */
import { addDays, type LocalDate } from './date';

/** 记一次打卡：去重，并按日期从早到晚排好 */
export function addCheckIn(dates: readonly LocalDate[], day: LocalDate): LocalDate[] {
  if (dates.includes(day)) return [...dates];
  return [...dates, day].sort();
}

export function hasCheckedIn(dates: readonly LocalDate[], day: LocalDate): boolean {
  return dates.includes(day);
}

/** 当前连续打卡天数 */
export function currentStreak(dates: readonly LocalDate[], today: LocalDate): number {
  const set = new Set(dates);
  let day: LocalDate;
  if (set.has(today)) day = today;
  else if (set.has(addDays(today, -1))) day = addDays(today, -1);
  else return 0;

  let count = 0;
  while (set.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}
