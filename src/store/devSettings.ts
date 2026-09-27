/**
 * 开发专用设置（模拟日期、预览未发布内容）只在开发环境生效。
 * 正式版里即使存储里留有这些值（比如同一台设备装过开发版），也一律按关闭处理——
 * 正式版的设置页不显示这些开关，用户没法自己关掉。
 */
import type { Settings } from './userStore';

/** 实际生效的日期偏移天数 */
export function effectiveDateOffset(settings: Pick<Settings, 'devDateOffsetDays'>, isDev: boolean = __DEV__): number {
  return isDev ? settings.devDateOffsetDays : 0;
}

/** 实际是否显示未发布内容 */
export function effectivePreview(settings: Pick<Settings, 'previewUnpublished'>, isDev: boolean = __DEV__): boolean {
  return isDev && settings.previewUnpublished;
}
