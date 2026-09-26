import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Loading } from '@/components/Loading';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { usePublishedArticles, useSeries } from '@/content/hooks';
import { useToday } from '@/hooks/useToday';
import { articleStatus, articleStatusLabel } from '@/logic/flow';
import { readableArticleId } from '@/logic/library';
import { usePreviewUnpublished } from '@/store/hooks';
import { useUserStore } from '@/store/userStore';
import { borderWidth, colors, opacity, radius, space } from '@/theme';

const openArticle = (id: string) => router.push({ pathname: '/article/[id]', params: { id } });

/** 系列详情：一句话介绍、适合什么时候读、关键洞察、思维导图、各期目录、名词卡 */
export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useToday();
  const preview = usePreviewUnpublished();
  const progress = useUserStore((s) => s.progress);
  const { data: series, loading } = useSeries(id);
  const articles = usePublishedArticles(today, preview);
  const visibleIds = useMemo(() => new Set((articles.data ?? []).map((a) => a.id)), [articles.data]);

  if (loading) return <Loading />;
  if (!series) return <Loading message="找不到这个系列。" />;

  /** 第 n 期现在能读的话，返回文章 id */
  const readableByIssue = (issueIndex: number) => {
    const issue = series.issues.find((x) => x.index === issueIndex);
    return issue ? readableArticleId(issue, visibleIds) : undefined;
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: series.titleZh }} />

      <View style={styles.hero}>
        <AppText variant="caption" tone="textMuted">
          拆书系列 · 共 {series.total} 期
        </AppText>
        <AppText variant="enDisplay">{series.titleEn}</AppText>
        <AppText variant="small" tone="textMuted">
          {series.titleZh} · {series.author} · {series.year}
        </AppText>
        <AppText variant="body" tone="textSubtle">
          {series.oneLiner}
        </AppText>
      </View>

      <Section title="什么时候适合读">
        <Row wrap gap="sm">
          {series.scenarios.map((s) => (
            <Chip key={s} label={s} />
          ))}
        </Row>
      </Section>

      <Section title="关键洞察">
        {series.insights.map((x, i) => (
          <Row key={i} gap="sm" style={styles.top}>
            <AppText variant="enBody" tone="primary">
              {i + 1}
            </AppText>
            <View style={styles.flex}>
              <AppText variant="subheading">{x.claim}</AppText>
              <AppText variant="small" tone="textMuted">
                {x.detail}
              </AppText>
            </View>
          </Row>
        ))}
      </Section>

      <Section title="思维导图" hint={`一图看懂 ${series.total} 期讲什么`}>
        <View style={styles.mmRoot}>
          <AppText variant="enHeading" tone="onPrimary">
            {series.mindmap.root}
          </AppText>
          <AppText variant="caption" tone="onPrimary">
            {series.mindmap.rootZh}
          </AppText>
        </View>
        <View style={styles.mmBranches}>
          {series.mindmap.branches.map((b) => {
            const articleId = readableByIssue(b.issue);
            return (
              <View key={b.issue} style={styles.mmBranch}>
                <Pressable disabled={!articleId} onPress={() => articleId && openArticle(articleId)}>
                  <AppText variant="subheading" tone={articleId ? 'primary' : 'text'}>
                    {`${b.issue}. ${b.title}`}
                    {articleId ? ' · 去读' : ''}
                  </AppText>
                </Pressable>
                {b.leaves.map((leaf) => (
                  <AppText key={leaf} variant="small" tone="textSubtle" style={styles.leaf}>
                    · {leaf}
                  </AppText>
                ))}
              </View>
            );
          })}
        </View>
      </Section>

      <Section title={`${series.total} 期目录`}>
        {series.issues.map((issue) => {
          const articleId = readableArticleId(issue, visibleIds);
          const label = articleId ? articleStatusLabel(articleStatus(progress[articleId])) : '即将上线';
          return (
            <Card key={issue.index} onPress={articleId ? () => openArticle(articleId) : undefined} style={!articleId && styles.soon}>
              <Row gap="md">
                <AppText variant="enTitle" tone="textMuted">
                  {issue.index}
                </AppText>
                <View style={styles.flex}>
                  <AppText variant="enBody">{issue.titleEn}</AppText>
                  <AppText variant="caption" tone="textMuted">
                    {issue.titleZh} · {issue.chapters} · {issue.level}
                  </AppText>
                </View>
                <AppText variant="caption" tone={articleId ? 'primary' : 'textMuted'}>
                  {label}
                </AppText>
              </Row>
            </Card>
          );
        })}
      </Section>

      <Section title="名词卡" hint="随期解锁，这里一次列全">
        {series.glossary.map((g) => (
          <View key={g.en} style={styles.glossary}>
            <Row spread>
              <AppText variant="enBody">{g.en}</AppText>
              <AppText variant="caption" tone="textMuted">
                第 {g.issue} 期
              </AppText>
            </Row>
            <AppText variant="small" tone="textSubtle">
              {g.zh}
            </AppText>
            <AppText variant="caption" tone="textMuted">
              {g.note}
            </AppText>
          </View>
        ))}
      </Section>

      <AppText variant="caption" tone="textMuted">
        {series.sourceNote}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.xs },
  top: { alignItems: 'flex-start' },
  flex: { flex: 1, gap: space.xxs },
  mmRoot: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  mmBranches: {
    marginLeft: space.lg,
    paddingLeft: space.lg,
    borderLeftWidth: borderWidth.thick,
    borderLeftColor: colors.borderStrong,
    gap: space.md,
  },
  mmBranch: { gap: space.xxs },
  leaf: { paddingLeft: space.md },
  soon: { opacity: opacity.muted },
  glossary: {
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
    paddingVertical: space.sm,
    gap: space.xxs,
  },
});
