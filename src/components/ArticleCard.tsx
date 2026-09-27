import { router } from 'expo-router';

import { COLUMN_LABELS, LEVEL_LABELS, type Article } from '@/content/types';
import { articleStatus, articleStatusLabel, type ArticleProgress } from '@/logic/flow';

import { AppText } from './AppText';
import { Card } from './Card';
import { Row } from './Row';

type Props = {
  article: Article;
  progress: ArticleProgress | undefined;
  /** 属于系列时显示"系列名 · 第 n 期" */
  seriesTitle?: string;
};

/** 文章卡片：标题、栏目 / 难度 / 时长、系列、状态。点了进文章页 */
export function ArticleCard({ article, progress, seriesTitle }: Props) {
  const status = articleStatus(progress);
  const statusTone = status.kind === 'completed' ? 'success' : status.kind === 'reading' ? 'primary' : 'textMuted';
  return (
    <Card onPress={() => router.push({ pathname: '/article/[id]', params: { id: article.id } })}>
      <AppText variant="caption" tone="textMuted">
        {[COLUMN_LABELS[article.column], LEVEL_LABELS[article.level], `约 ${article.minutes} 分钟`, article.publishAt].join(
          ' · ',
        )}
      </AppText>
      <AppText variant="enHeading">{article.titleEn}</AppText>
      <AppText variant="small" tone="textSubtle">
        {article.titleZh}
      </AppText>
      <Row spread wrap>
        <AppText variant="caption" tone="textMuted">
          {seriesTitle && article.seriesIndex ? `${seriesTitle} · 第 ${article.seriesIndex} 期` : ' '}
        </AppText>
        <AppText variant="caption" tone={statusTone}>
          {articleStatusLabel(status)}
        </AppText>
      </Row>
    </Card>
  );
}
