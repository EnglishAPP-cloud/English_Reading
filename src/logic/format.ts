/** 显示用的小格式化函数 */

/** 秒数 → "m:ss"；负数按 0 算。例：240 → "4:00"，75.6 → "1:16" */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 秒数 → "约 N 分钟"（向上取整，至少 1 分钟） */
export function formatMinutes(seconds: number): string {
  return `${Math.max(1, Math.ceil(seconds / 60))} 分钟`;
}
