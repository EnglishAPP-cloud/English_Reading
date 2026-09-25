/**
 * store 用的"现在"：真实时间 + 开发用的日期偏移（设置页"模拟日期 +1 天"）。
 * 页面上的"今天"用 src/hooks/useToday.ts，两边算法一致。
 */
import { todayLocal, type LocalDate } from '@/logic/date';

const DAY_MS = 86_400_000;

export function clockNow(offsetDays: number, now: Date = new Date()): { today: LocalDate; nowIso: string } {
  return {
    today: todayLocal(now, offsetDays),
    nowIso: new Date(now.getTime() + offsetDays * DAY_MS).toISOString(),
  };
}
