import { useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { createProgress, isReviewingRawRead, progressOnOpen } from '@/logic/flow';
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
  const stored = useArticleProgress(article.id) ?? EMPTY_PROGRESS;
  // 打开时：已完成的文章回到练习步骤。第一帧就按打开后的样子显示（不先闪一下旧步骤），
  // 同时在 effect 里把它写进 store；之后用户在页面里回看前面的步骤，就照存储的来
  const opened = useRef(false);
  const progress = opened.current ? stored : progressOnOpen(stored);
  const goToStep = useUserStore((s) => s.goToStep);
  const openArticle = useUserStore((s) => s.openArticle);
  const finishRawRead = useUserStore((s) => s.finishRawRead);
  const positions = useParagraphPositions();
  const focused = useIsFocused();

  useEffect(() => {
    openArticle(article.id);
    opened.current = true;
  }, [article.id, openArticle]);

  const rawReading = progress.step === 'raw' && !isReviewingRawRead(progress);
  // 只在"停在裸读页、页面在前台"时计时
  const timer = useRawReadTimer(article.id, rawReading && focused);
  const onFinishRawRead = () => {
    timer.flush(); // 先把还没写进进度的秒数写进去，再记用时
    finishRawRead(article.id);
  };

  // 换步骤时回到顶部
  const { scrollRef } = positions;
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [progress.step, scrollRef]);

  return (
    <View style={styles.root}>
      {rawReading ? <RawReadTimerBar article={article} progress={progress} timer={timer} /> : null}
      <Screen scrollRef={scrollRef}>
        <ArticleHeader article={article} completed={!!progress.completedAt} />
        <StepBar progress={progress} onGo={(step) => goToStep(article.id, step)} />
        {progress.step === 'orient' ? <OrientStep article={article} progress={progress} /> : null}
        {progress.step === 'raw' ? (
          <RawReadStep article={article} progress={progress} positions={positions} onFinish={onFinishRawRead} />
        ) : null}
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
