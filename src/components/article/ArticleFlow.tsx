import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { createProgress, isReviewingRawRead } from '@/logic/flow';
import { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { useRawReadTimer } from '@/hooks/useRawReadTimer';
import { useArticleProgress } from '@/store/hooks';
import { useUserStore } from '@/store/userStore';
import { colors } from '@/theme';

import { AppText } from '../AppText';
import { Screen } from '../Screen';

import { ArticleHeader } from './ArticleHeader';
import { CheckStep } from './CheckStep';
import { OrientStep } from './OrientStep';
import { PracticeStep } from './PracticeStep';
import { RawReadStep, RawReadTimerBar } from './RawReadStep';
import { StepBar } from './StepBar';

/** 还没开始读的文章用这个空进度显示（不写入存储，第一次有效操作时才创建） */
const EMPTY_PROGRESS = createProgress();

/**
 * 文章页的四步流程。当前在哪一步、每一步的状态都来自 store 里保存的进度，
 * 所以退出 APP 再进来会停在原来的步骤。
 */
export function ArticleFlow({ article }: { article: Article }) {
  const progress = useArticleProgress(article.id) ?? EMPTY_PROGRESS;
  const goToStep = useUserStore((s) => s.goToStep);
  const positions = useParagraphPositions();
  const focused = useIsFocused();

  const rawReading = progress.step === 'raw' && !isReviewingRawRead(progress);
  // 只在"停在裸读页、页面在前台"时计时
  useRawReadTimer(article.id, rawReading && focused);

  // 换步骤时回到顶部
  const { scrollRef } = positions;
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [progress.step, scrollRef]);

  return (
    <View style={styles.root}>
      {rawReading ? <RawReadTimerBar article={article} progress={progress} /> : null}
      <Screen scrollRef={scrollRef}>
        <ArticleHeader article={article} completed={!!progress.completedAt} />
        <StepBar progress={progress} onGo={(step) => goToStep(article.id, step)} />
        {progress.step === 'orient' ? <OrientStep article={article} progress={progress} /> : null}
        {progress.step === 'raw' ? <RawReadStep article={article} progress={progress} positions={positions} /> : null}
        {progress.step === 'check' ? <CheckStep article={article} progress={progress} /> : null}
        {progress.step === 'practice' ? (
          <PracticeStep article={article} progress={progress} positions={positions} />
        ) : null}
        <AppText variant="caption" tone="textMuted">
          {article.sourceNote}
        </AppText>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
