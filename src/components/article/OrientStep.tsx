import type { Article } from '@/content/types';
import { formatMinutes } from '@/logic/format';
import { STEP_LABELS, type ArticleProgress } from '@/logic/flow';
import { useUserStore } from '@/store/userStore';
import { colors } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Notice } from '../Notice';

/** 第 1 步 定向：背景 + 带着去读的问题 */
export function OrientStep({ article, progress }: { article: Article; progress: ArticleProgress }) {
  const startRawRead = useUserStore((s) => s.startRawRead);
  const goToStep = useUserStore((s) => s.goToStep);
  const started = progress.reachedStep !== 'orient';

  return (
    <>
      <AppText variant="caption" tone="textMuted">
        第 1 步 · 定向
      </AppText>
      <Notice>
        <AppText>{article.orientation.background}</AppText>
      </Notice>
      <Notice color={colors.borderStrong}>
        <AppText variant="caption" tone="textMuted">
          带着这个问题读
        </AppText>
        <AppText variant="subheading">{article.orientation.question}</AppText>
      </Notice>
      {started ? (
        <Button
          title={`回到「${STEP_LABELS[progress.reachedStep]}」`}
          onPress={() => goToStep(article.id, progress.reachedStep)}
        />
      ) : (
        <>
          <Button title={`开始裸读 · ${formatMinutes(article.rawReadSeconds)}`} onPress={() => startRawRead(article.id)} />
          <AppText variant="caption" tone="textMuted">
            裸读时不查词、不看中文，读不懂的地方先跳过。读完用 {article.check.length} 道题检测，再决定这篇怎么练。
          </AppText>
        </>
      )}
    </>
  );
}
