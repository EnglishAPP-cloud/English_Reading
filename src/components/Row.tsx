import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { space } from '@/theme';

type Props = {
  children: ReactNode;
  /** 间距档位，见 theme/spacing */
  gap?: keyof typeof space;
  wrap?: boolean;
  /** 两端对齐 */
  spread?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 横向排列 */
export function Row({ children, gap = 'sm', wrap, spread, style }: Props) {
  return (
    <View
      style={[
        styles.row,
        { gap: space[gap] },
        wrap && styles.wrap,
        spread && styles.spread,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  spread: { justifyContent: 'space-between' },
});
