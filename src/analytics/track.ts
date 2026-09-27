/**
 * 埋点。现在只打印到控制台；以后接统计平台时只改这个文件。
 *
 * 事件清单（新增事件先加到这里）：
 * - read_start       点"开始裸读"
 * - read_complete    点练习页底部的"读完了"
 * - check_submit     提交检测（带得分和推荐练法）
 * - mode_switch      切换练法
 * - favorite_add     收藏词或句子
 * - favorite_remove  取消收藏
 * - review_grade     复习评分
 */
export type TrackEvent =
  | 'read_start'
  | 'read_complete'
  | 'check_submit'
  | 'mode_switch'
  | 'favorite_add'
  | 'favorite_remove'
  | 'review_grade';

export type TrackProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: TrackEvent, props: TrackProps = {}): void {
  console.log('[track]', event, props);
}
