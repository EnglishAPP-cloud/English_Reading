/**
 * 设计 tokens 的统一出口。组件统一这样用：
 *   import { colors, space, textVariants } from '@/theme';
 */
export { colors, modeColors, type ColorName } from './colors';
export { fontFamily, fontSize, textVariants, type TextVariant } from './typography';
export { space, radius, borderWidth } from './spacing';
export { opacity } from './effects';
