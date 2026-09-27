/** 间距 tokens（单位 dp）。组件里的 padding / margin / gap 都从这里取。 */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** 圆角 tokens */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** 边框粗细 */
export const borderWidth = {
  hairline: 1,
  thick: 2,
} as const;
