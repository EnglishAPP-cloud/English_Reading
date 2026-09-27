import { StyleSheet } from 'react-native';

import { AppText } from './AppText';
import { Card } from './Card';

type Props = {
  label: string;
  value: number | string;
  unit?: string;
  onPress?: () => void;
};

/** 数字卡片：连续打卡天数、今天待复习数 */
export function StatCard({ label, value, unit, onPress }: Props) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <AppText variant="caption" tone="textMuted">
        {label}
      </AppText>
      <AppText variant="enTitle" tone="primary">
        {value}
        {unit ? (
          <AppText variant="small" tone="textMuted">
            {` ${unit}`}
          </AppText>
        ) : null}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
});
