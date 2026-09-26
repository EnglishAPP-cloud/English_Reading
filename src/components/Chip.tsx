import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, opacity, radius, space } from '@/theme';

import { AppText } from './AppText';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 选中时的主色（比如三种练法各自的颜色）；不传用主色 */
  color?: string;
  /** 选中时的浅底色；不传用实心主色 */
  softColor?: string;
  disabled?: boolean;
};

/** 小圆角标签：筛选、练法切换、反馈标签、开关都用它 */
export function Chip({ label, selected, onPress, color, softColor, disabled }: Props) {
  const solid = selected && !softColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && {
          backgroundColor: softColor ?? color ?? colors.primary,
          borderColor: softColor ? (color ?? colors.primary) : colors.transparent,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        variant="small"
        style={{ color: solid ? colors.onPrimary : selected ? (color ?? colors.primary) : colors.textSubtle }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: space.xs + space.xxs,
    paddingHorizontal: space.md,
  },
  disabled: { opacity: opacity.disabled },
  pressed: { opacity: opacity.pressed },
});
