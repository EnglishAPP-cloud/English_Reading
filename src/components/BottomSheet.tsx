import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** 从底部弹出的卡片：点遮罩或返回键关闭。用 React Native 自带的 Modal 实现 */
export function BottomSheet({ visible, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="关闭" />
        <View style={[styles.sheet, { paddingBottom: space.xl + insets.bottom }]}>
          <View style={styles.grabber} />
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.md,
    maxHeight: '85%',
  },
  grabber: {
    alignSelf: 'center',
    width: space.xxxl,
    height: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    marginBottom: space.md,
  },
  content: { paddingHorizontal: space.xl, gap: space.md },
});
