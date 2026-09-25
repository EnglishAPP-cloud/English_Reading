import { StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { formatDuration } from '@/logic/format';
import { isReviewingRawRead, rawReadRemaining, STEP_LABELS, type ArticleProgress } from '@/logic/flow';
import type { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { useUserStore } from '@/store/userStore';
import { colors, radius, space } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Notice } from '../Notice';

import { ParagraphView } from './ParagraphView';

type Positions = ReturnType<typeof useParagraphPositions>;

/** 裸读倒计时条（固定在页面顶部，不随正文滚动）。时间到了只提示，不跳转 */
export function RawReadTimerBar({
  article,
  progress,
  pendingSec,
}: {
  article: Article;
  progress: ArticleProgress;
  /** 已经计时、还没写进进度的秒数 */
  pendingSec: number;
}) {
  const remaining = rawReadRemaining(progress, article.rawReadSeconds) - pendingSec;
  const over = remaining <= 0;
  return (
    <View style={[styles.timer, over && styles.timerOver]}>
      <AppText variant="enHeading" tone="onPrimary">
        {over ? '时间到' : formatDuration(remaining)}
      </AppText>
      <AppText variant="small" tone="onPrimary">
        {over ? '读到哪算哪，可以去检测了' : '裸读中 · 不查词、不看中文'}
      </AppText>
    </View>
  );
}

/** 第 2 步 裸读：纯英文，不加任何标注、不显示中文 */
export function RawReadStep({
  article,
  progress,
  positions,
  onFinish,
}: {
  article: Article;
  progress: ArticleProgress;
  positions: Positions;
  /** 点"读完了"（由 ArticleFlow 先把计时写进进度再记用时） */
  onFinish: () => void;
}) {
  const goToStep = useUserStore((s) => s.goToStep);
  const reviewing = isReviewingRawRead(progress);

  return (
    <>
      {reviewing ? (
        <Notice>
          <AppText variant="small" tone="textSubtle">
            回看原文 · 裸读用时 {formatDuration(progress.rawUsedSec ?? 0)}（不再计时）
          </AppText>
        </Notice>
      ) : null}
      <Notice color={colors.borderStrong}>
        <AppText variant="caption" tone="textMuted">
          带着这个问题读
        </AppText>
        <AppText variant="subheading">{article.orientation.question}</AppText>
      </Notice>
      <View style={styles.list} onLayout={positions.onListLayout}>
        {article.paragraphs.map((p, i) => (
          <ParagraphView key={p.id} paragraph={p} index={i} onLayout={positions.onParagraphLayout(p.id)} />
        ))}
      </View>
      {reviewing ? (
        <Button
          title={`回到「${STEP_LABELS[progress.reachedStep]}」`}
          onPress={() => goToStep(article.id, progress.reachedStep)}
        />
      ) : (
        <Button title="读完了，去检测" onPress={onFinish} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    backgroundColor: colors.primary,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    marginHorizontal: space.lg,
    marginTop: space.sm,
    borderRadius: radius.md,
  },
  timerOver: { backgroundColor: colors.warning },
  list: { gap: space.md },
});
