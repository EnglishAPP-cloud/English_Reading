import { Pressable, StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { canSubmitCheck, MODE_LABELS, type ArticleProgress } from '@/logic/flow';
import { formatDuration } from '@/logic/format';
import { useUserStore } from '@/store/userStore';
import { borderWidth, colors, modeColors, radius, space } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Card } from '../Card';
import { Notice } from '../Notice';

import { MODE_TIPS } from './modeCopy';

const LETTERS = 'ABCDEFGH';

/** 第 3 步 检测：全部答完才能提交；提交后显示对错、解析和分流结果，不能再改 */
export function CheckStep({ article, progress }: { article: Article; progress: ArticleProgress }) {
  const pick = useUserStore((s) => s.pickCheckAnswer);
  const submit = useUserStore((s) => s.submitCheck);
  const startPractice = useUserStore((s) => s.startPractice);
  const goToStep = useUserStore((s) => s.goToStep);
  const result = progress.checkResult;
  const total = article.check.length;

  return (
    <>
      <AppText variant="caption" tone="textMuted">
        第 3 步 · 检测
      </AppText>
      <AppText variant="small" tone="textMuted">
        {progress.rawUsedSec !== undefined ? `裸读用时 ${formatDuration(progress.rawUsedSec)}。` : ''}
        {total} 道题，按答对几道决定接下来怎么练。不能回看原文。
      </AppText>

      {article.check.map((q, qi) => (
        <Card key={qi}>
          <AppText variant="caption" style={{ color: modeColors.challenge.main }}>
            {q.type}
          </AppText>
          <AppText variant="enBody">{`${qi + 1}. ${q.prompt}`}</AppText>
          <View style={styles.options}>
            {q.options.map((o, oi) => {
              const picked = progress.checkPicks[qi] === oi;
              const right = !!result && oi === q.answer;
              const wrong = !!result && picked && oi !== q.answer;
              return (
                <Pressable
                  key={oi}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked, disabled: !!result }}
                  disabled={!!result}
                  onPress={() => pick(article.id, qi, oi, total)}
                  style={[
                    styles.option,
                    picked && styles.optionPicked,
                    right && styles.optionRight,
                    wrong && styles.optionWrong,
                  ]}
                >
                  <AppText variant="caption" tone="textMuted" style={styles.letter}>
                    {LETTERS[oi]}
                  </AppText>
                  <AppText variant="enSmall" style={styles.optionText}>
                    {o}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {result ? (
            <AppText variant="small" tone="textSubtle">
              {progress.checkPicks[qi] === q.answer ? '✓ 答对了。' : '✗ 答错了。'}
              {q.explanation}
            </AppText>
          ) : null}
        </Card>
      ))}

      {result ? (
        <Notice color={modeColors[result.recommended].main} softColor={modeColors[result.recommended].soft}>
          <AppText variant="heading" style={{ color: modeColors[result.recommended].main }}>
            答对 {result.correct} / {result.total} 道 → {MODE_LABELS[result.recommended]}
          </AppText>
          <AppText variant="small" tone="textSubtle">
            {MODE_TIPS[result.recommended]}
          </AppText>
          {progress.reachedStep === 'practice' ? (
            <Button title="回到练习" onPress={() => goToStep(article.id, 'practice')} />
          ) : (
            <Button title="开始练习" onPress={() => startPractice(article.id)} />
          )}
        </Notice>
      ) : (
        <Button title="提交" disabled={!canSubmitCheck(progress, total)} onPress={() => submit(article)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  options: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  optionPicked: { borderColor: colors.primary, borderWidth: borderWidth.thick },
  optionRight: { borderColor: colors.success, borderWidth: borderWidth.thick, backgroundColor: colors.successSoft },
  optionWrong: { borderColor: colors.danger, borderWidth: borderWidth.thick, backgroundColor: colors.dangerSoft },
  letter: { paddingTop: space.xxs, width: space.md },
  optionText: { flex: 1 },
});
