import { Pressable, StyleSheet, View } from 'react-native';

import { canGoToStep, STEP_LABELS, STEPS, stepIndex, type ArticleProgress, type StepId } from '@/logic/flow';
import { colors, radius, space } from '@/theme';

import { AppText } from '../AppText';

type Props = {
  progress: ArticleProgress;
  onGo: (step: StepId) => void;
};

/** 四步进度条：到过的步骤加深；检测提交后可以点回去看 */
export function StepBar({ progress, onGo }: Props) {
  const reached = stepIndex(progress.reachedStep);
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {STEPS.map((step, i) => {
        const current = step === progress.step;
        const enabled = !current && canGoToStep(progress, step);
        return (
          <Pressable
            key={step}
            accessibilityRole="tab"
            accessibilityState={{ selected: current, disabled: !enabled }}
            disabled={!enabled}
            onPress={() => onGo(step)}
            style={styles.item}
          >
            <View
              style={[
                styles.track,
                i <= reached && styles.trackDone,
                current && styles.trackCurrent,
              ]}
            />
            <AppText variant="caption" tone={current ? 'primary' : i <= reached ? 'textSubtle' : 'textMuted'}>
              {`${i + 1} ${STEP_LABELS[step]}`}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: space.xs },
  item: { flex: 1, alignItems: 'center', gap: space.xs },
  track: { alignSelf: 'stretch', height: space.xs, borderRadius: radius.pill, backgroundColor: colors.border },
  trackDone: { backgroundColor: colors.borderStrong },
  trackCurrent: { backgroundColor: colors.primary },
});
