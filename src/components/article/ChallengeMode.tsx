import { StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { canCheckHeadings, headingResults, type ArticleProgress } from '@/logic/flow';
import type { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { useUserStore } from '@/store/userStore';
import { modeColors, space } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Row } from '../Row';
import { Select } from '../Select';

import { ParagraphView } from './ParagraphView';

type Positions = ReturnType<typeof useParagraphPositions>;

/** 挑战：每段上方选一个小标题；全部选完才能检查，检查后显示对错和参考答案 */
export function ChallengeMode({
  article,
  progress,
  positions,
}: {
  article: Article;
  progress: ArticleProgress;
  positions: Positions;
}) {
  const pickHeading = useUserStore((s) => s.pickHeading);
  const checkHeadings = useUserStore((s) => s.checkHeadings);
  const resetHeadings = useUserStore((s) => s.resetHeadings);

  const { options, answers, note } = article.headings;
  const ids = article.paragraphs.map((p) => p.id);
  const checked = progress.headingsChecked;
  const results = headingResults(progress, article.headings, ids);

  return (
    <>
      <View style={styles.list} onLayout={positions.onListLayout}>
        {article.paragraphs.map((p, i) => {
          const ok = results.byParagraph[p.id];
          const answer = answers[p.id];
          return (
            <ParagraphView
              key={p.id}
              paragraph={p}
              index={i}
              onLayout={positions.onParagraphLayout(p.id)}
              above={
                <View style={styles.select}>
                  <Select
                    english
                    options={options}
                    value={progress.headingPicks[p.id]}
                    onChange={(idx) => pickHeading(article.id, p.id, idx)}
                    placeholder={`给第 ${i + 1} 段选一个小标题…`}
                    disabled={checked}
                    status={checked ? (ok ? 'ok' : 'bad') : undefined}
                    color={modeColors.challenge.main}
                    softColor={modeColors.challenge.soft}
                  />
                  {checked ? (
                    <AppText variant="caption" tone={ok ? 'success' : 'danger'}>
                      {ok ? '✓ 对了' : `参考答案：${answer === undefined ? '' : options[answer]}`}
                    </AppText>
                  ) : null}
                </View>
              }
            />
          );
        })}
      </View>

      {checked ? (
        <Row gap="md" wrap>
          <AppText variant="subheading">
            选对 {results.correct} / {results.total} 段
          </AppText>
          <Button small variant="ghost" title="重新选" onPress={() => resetHeadings(article.id)} />
        </Row>
      ) : (
        <>
          <Button
            title="检查小标题"
            disabled={!canCheckHeadings(progress, ids)}
            onPress={() => checkHeadings(article)}
          />
          {note ? (
            <AppText variant="caption" tone="textMuted">
              {note}
            </AppText>
          ) : null}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.lg },
  select: { gap: space.xs },
});
