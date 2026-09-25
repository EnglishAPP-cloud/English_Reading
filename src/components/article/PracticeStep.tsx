import type { Article } from '@/content/types';
import { MODE_LABELS, PRACTICE_MODES, type ArticleProgress } from '@/logic/flow';
import type { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { useUserStore } from '@/store/userStore';
import { modeColors } from '@/theme';

import { AppText } from '../AppText';
import { Chip } from '../Chip';
import { Notice } from '../Notice';
import { Row } from '../Row';

import { AccurateMode } from './AccurateMode';
import { ChallengeMode } from './ChallengeMode';
import { CommonPractice } from './CommonPractice';
import { DeepMode } from './DeepMode';
import { MODE_TIPS } from './modeCopy';

type Positions = ReturnType<typeof useParagraphPositions>;

/** 第 4 步 练习：进入推荐练法，可以随时切换另外两种 */
export function PracticeStep({
  article,
  progress,
  positions,
}: {
  article: Article;
  progress: ArticleProgress;
  positions: Positions;
}) {
  const switchMode = useUserStore((s) => s.switchMode);
  const result = progress.checkResult;
  if (!result) return null; // 正常走不到：没提交检测进不了练习
  const mode = progress.mode ?? result.recommended;
  const color = modeColors[mode];

  return (
    <>
      <Notice color={color.main} softColor={color.soft}>
        <AppText variant="subheading" style={{ color: color.main }}>
          第 4 步 · {MODE_LABELS[mode]}
        </AppText>
        <AppText variant="caption" tone="textSubtle">
          检测答对 {result.correct} / {result.total} 道，推荐「{MODE_LABELS[result.recommended]}」
          {mode !== result.recommended ? `；你换成了「${MODE_LABELS[mode]}」` : ''}
        </AppText>
        <AppText variant="small" tone="textSubtle">
          {MODE_TIPS[mode]}
        </AppText>
      </Notice>

      <Row wrap gap="sm">
        <AppText variant="caption" tone="textMuted">
          换一种练法
        </AppText>
        {PRACTICE_MODES.map((m) => (
          <Chip
            key={m}
            label={MODE_LABELS[m]}
            selected={m === mode}
            color={modeColors[m].main}
            softColor={modeColors[m].soft}
            onPress={() => switchMode(article.id, m)}
          />
        ))}
      </Row>

      {mode === 'deep' ? <DeepMode key="deep" article={article} positions={positions} /> : null}
      {mode === 'accurate' ? <AccurateMode article={article} progress={progress} positions={positions} /> : null}
      {mode === 'challenge' ? <ChallengeMode article={article} progress={progress} positions={positions} /> : null}

      <CommonPractice article={article} progress={progress} />
    </>
  );
}
