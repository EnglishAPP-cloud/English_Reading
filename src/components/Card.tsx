import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, opacity, radius, space } from '@/theme';

type Props = {
  children: ReactNode;
  /** 传了就变成可点的卡片 */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 卡片：白底、细边框、圆角 */
export function Card({ children, onPress, style }: Props) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  pressed: { opacity: opacity.pressed },
});
