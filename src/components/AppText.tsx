import { Text, type TextProps } from 'react-native';

import { colors, textVariants, type ColorName, type TextVariant } from '@/theme';

type Props = TextProps & {
  /** 文字样式，见 src/theme/typography.ts */
  variant?: TextVariant;
  /** 文字颜色，见 src/theme/colors.ts */
  tone?: ColorName;
};

/** 全 APP 统一的文字组件：字号、字体、颜色都从 theme 里取 */
export function AppText({ variant = 'body', tone = 'text', style, ...rest }: Props) {
  return <Text style={[textVariants[variant], { color: colors[tone] }, style]} {...rest} />;
}
