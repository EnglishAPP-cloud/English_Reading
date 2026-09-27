import { StyleSheet, View } from 'react-native';

import { COLUMN_LABELS, LEVEL_LABELS, type Article } from '@/content/types';
import { space } from '@/theme';

import { AppText } from '../AppText';

/** 文章页顶部：栏目 · 难度 · 字数 · 时长，英文标题，中文标题 */
export function ArticleHeader({ article, completed }: { article: Article; completed: boolean }) {
  const meta = [
    COLUMN_LABELS[article.column],
    LEVEL_LABELS[article.level],
    article.seriesIndex ? `拆书第 ${article.seriesIndex} 期` : null,
    `${article.wordCount} 词`,
    `约 ${article.minutes} 分钟`,
  ].filter(Boolean);

  return (
    <View style={styles.header}>
      <AppText variant="caption" tone="textMuted">
        {meta.join(' · ')}
        {completed ? ' · 已完成' : ''}
      </AppText>
      <AppText variant="enTitle">{article.titleEn}</AppText>
      <AppText variant="body" tone="textMuted">
        {article.titleZh}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
});
