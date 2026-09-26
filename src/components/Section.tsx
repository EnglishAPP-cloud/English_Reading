import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme';

import { AppText } from './AppText';

type Props = {
  title: string;
  /** 标题旁边的小字说明 */
  hint?: string;
  children: ReactNode;
};

/** 页面里的一个分区：标题 + 内容 */
export function Section({ title, hint, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <AppText variant="subheading">{title}</AppText>
        {hint ? (
          <AppText variant="caption" tone="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: space.sm },
});
