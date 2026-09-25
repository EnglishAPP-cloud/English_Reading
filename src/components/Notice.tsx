import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, radius, space } from '@/theme';

type Props = {
  children: ReactNode;
  /** 主色（边框和文字）；不传用普通浅底 */
  color?: string;
  softColor?: string;
};

/** 带底色的提示块：分流结果、说明文字等 */
export function Notice({ children, color, softColor }: Props) {
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: softColor ?? colors.surfaceMuted, borderColor: color ?? colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.lg,
    borderWidth: borderWidth.hairline,
    padding: space.lg,
    gap: space.sm,
  },
});
