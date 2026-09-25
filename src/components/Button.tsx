import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, radius, space } from '@/theme';

import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** 撑满一行 */
  block?: boolean;
  small?: boolean;
};

/** 按钮：primary 实心主色，secondary 浅底，ghost 只有边框 */
export function Button({ title, onPress, variant = 'primary', disabled, block, small }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        styles[variant],
        block && styles.block,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant={small ? 'small' : 'body'} tone={variant === 'primary' ? 'onPrimary' : 'text'}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: space.sm + space.xxs,
    paddingHorizontal: space.lg + space.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  small: { paddingVertical: space.xs + space.xxs, paddingHorizontal: space.md },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceMuted, borderWidth: borderWidth.hairline, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', borderWidth: borderWidth.hairline, borderColor: colors.borderStrong },
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});
