import { router } from 'expo-router';
import { useMemo } from 'react';

import { AppText } from '@/components/AppText';
import { ArticleCard } from '@/components/ArticleCard';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StatCard } from '@/components/StatCard';
import { useAllSeries, usePublishedArticles } from '@/content/hooks';
import { useToday } from '@/hooks/useToday';
import { formatMonthDay } from '@/logic/date';
import { articleStatus } from '@/logic/flow';
import { pickTodayArticle } from '@/logic/today';
import { useDueFavorites, useStreak } from '@/store/hooks';
import { useUserStore } from '@/store/userStore';

/** 今日：今天该读的一篇（全部读完则引导去复习），连续打卡天数，今天待复习数 */
export default function TodayScreen() {
  const today = useToday();
  const preview = useUserStore((s) => s.settings.previewUnpublished);
  const progress = useUserStore((s) => s.progress);
  const articles = usePublishedArticles(today, preview);
  const series = useAllSeries();
  const streak = useStreak(today);
  const due = useDueFavorites(today);

  const todayArticle = useMemo(
    () => (articles.data ? pickTodayArticle(articles.data, progress) : undefined),
    [articles.data, progress],
  );
  const seriesTitle = series.data?.find((s) => s.id === todayArticle?.seriesId)?.titleEn;
  const status = articleStatus(todayArticle ? progress[todayArticle.id] : undefined);
  const goReview = () => router.push('/review');

  return (
    <Screen>
      <AppText variant="caption" tone="textMuted">
        {formatMonthDay(today)}
        {preview ? ' · 预览模式：显示未发布内容' : ''}
      </AppText>

      <Row gap="md">
        <StatCard label="连续打卡" value={streak} unit="天" />
        <StatCard label="今天待复习" value={due.length} unit="个" onPress={due.length > 0 ? goReview : undefined} />
      </Row>

      {articles.loading ? (
        <AppText tone="textMuted">加载中…</AppText>
      ) : todayArticle ? (
        <Section title="今天读这篇">
          <ArticleCard article={todayArticle} progress={progress[todayArticle.id]} seriesTitle={seriesTitle} />
          <Button
            block
            title={status.kind === 'unread' ? '开始读' : '继续读'}
            onPress={() => router.push({ pathname: '/article/[id]', params: { id: todayArticle.id } })}
          />
        </Section>
      ) : (
        <Card>
          <AppText variant="heading">已发布的文章都读完了</AppText>
          {due.length > 0 ? (
            <>
              <AppText variant="small" tone="textSubtle">
                趁热把收藏的词和句子过一遍。
              </AppText>
              <Button title={`去复习 ${due.length} 个`} onPress={goReview} />
            </>
          ) : (
            <AppText variant="small" tone="textSubtle">
              今天也没有要复习的。新文章上线后会出现在这里。
            </AppText>
          )}
        </Card>
      )}
    </Screen>
  );
}
