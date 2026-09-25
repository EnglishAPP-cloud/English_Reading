import type { TextStyle } from 'react-native';

/**
 * 字体 tokens。
 * 英文正文用 Lora（在 app/_layout.tsx 里加载）；中文不设 fontFamily，用系统字体。
 * 注意：自定义字体在安卓上不认 fontWeight，所以 Lora 的粗细靠换字体名，而不是 fontWeight。
 */
export const fontFamily = {
  en: 'Lora_400Regular',
  enItalic: 'Lora_400Regular_Italic',
  enMedium: 'Lora_500Medium',
  enSemiBold: 'Lora_600SemiBold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  display: 30,
} as const;

/** 行高 = 字号 × 倍数（React Native 的 lineHeight 要写绝对值） */
const lh = (size: number, ratio: number) => Math.round(size * ratio);

/**
 * 文字样式。组件通过 <AppText variant="..."> 使用，别在组件里直接写字号。
 * 以 en 开头的是英文（Lora），其他是中文（系统字体）。
 */
export const textVariants = {
  // —— 中文 ——
  title: { fontSize: fontSize.xl, lineHeight: lh(fontSize.xl, 1.35), fontWeight: '600' },
  heading: { fontSize: fontSize.lg, lineHeight: lh(fontSize.lg, 1.4), fontWeight: '600' },
  subheading: { fontSize: fontSize.base, lineHeight: lh(fontSize.base, 1.5), fontWeight: '600' },
  body: { fontSize: fontSize.base, lineHeight: lh(fontSize.base, 1.6) },
  small: { fontSize: fontSize.md, lineHeight: lh(fontSize.md, 1.6) },
  caption: { fontSize: fontSize.sm, lineHeight: lh(fontSize.sm, 1.5) },
  tiny: { fontSize: fontSize.xs, lineHeight: lh(fontSize.xs, 1.4) },
  // —— 英文 ——
  enDisplay: { fontFamily: fontFamily.enSemiBold, fontSize: fontSize.display, lineHeight: lh(fontSize.display, 1.15) },
  enTitle: { fontFamily: fontFamily.enSemiBold, fontSize: fontSize.xxl, lineHeight: lh(fontSize.xxl, 1.2) },
  enHeading: { fontFamily: fontFamily.enMedium, fontSize: fontSize.xl, lineHeight: lh(fontSize.xl, 1.35) },
  enReading: { fontFamily: fontFamily.en, fontSize: fontSize.lg, lineHeight: lh(fontSize.lg, 1.72) }, // 文章正文
  enBody: { fontFamily: fontFamily.en, fontSize: fontSize.base, lineHeight: lh(fontSize.base, 1.5) },
  enSmall: { fontFamily: fontFamily.en, fontSize: fontSize.md, lineHeight: lh(fontSize.md, 1.5) },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;
