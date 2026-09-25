import type { ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';

import { colors, space } from '@/theme';

type Props = {
  children: ReactNode;
  /** 默认可滚动；复习卡这种需要固定布局的页面传 false */
  scroll?: boolean;
  scrollRef?: Ref<ScrollView>;
  onScroll?: ScrollViewProps['onScroll'];
};

/** 页面容器：统一背景色和左右边距 */
export function Screen({ children, scroll = true, scrollRef, onScroll }: Props) {
  if (!scroll) return <View style={[styles.fill, styles.content]}>{children}</View>;
  return (
    <ScrollView
      ref={scrollRef}
      style={styles.fill}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      // iOS：弹出键盘时自动留出空间，底部的输入框不会被挡住
      automaticallyAdjustKeyboardInsets
      onScroll={onScroll}
      scrollEventThrottle={100}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: space.xxxl, gap: space.lg },
});
