import { useMemo, useState } from 'react';

import { AppText } from '@/components/AppText';
import { ArticleCard } from '@/components/ArticleCard';
import { Chip } from '@/components/Chip';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SeriesCard } from '@/components/SeriesCard';
import { useAllSeries, usePublishedArticles } from '@/content/hooks';
import { COLUMN_LABELS, type Column } from '@/content/types';
import { useToday } from '@/hooks/useToday';
import { filterByColumn, filterSeriesByColumn, seriesReadCount, type ColumnFilter } from '@/logic/library';
import { useUserStore } from '@/store/userStore';

const FILTERS: { key: ColumnFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  ...(Object.keys(COLUMN_LABELS) as Column[]).map((key) => ({ key, label: COLUMN_LABELS[key] })),
];

/** 知识库：上面系列卡片，下面单篇列表；可按栏目筛选 */
export default function LibraryScreen() {
  const today = useToday();
  const preview = useUserStore((s) => s.settings.previewUnpublished);
  const progress = useUserStore((s) => s.progress);
  const articles = usePublishedArticles(today, preview);
  const series = useAllSeries();
  const [filter, setFilter] = useState<ColumnFilter>('all');

  const visibleArticles = useMemo(() => articles.data ?? [], [articles.data]);
  const shownSeries = useMemo(
    () => filterSeriesByColumn(series.data ?? [], visibleArticles, filter),
    [series.data, visibleArticles, filter],
  );
  const shownArticles = useMemo(() => filterByColumn(visibleArticles, filter), [visibleArticles, filter]);
  const seriesTitle = (id: string | undefined) => series.data?.find((s) => s.id === id)?.titleEn;

  return (
    <Screen>
      <Row wrap gap="sm">
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </Row>

      {articles.loading || series.loading ? <AppText tone="textMuted">加载中…</AppText> : null}

      {shownSeries.length > 0 ? (
        <Section title="拆书系列">
          {shownSeries.map((s) => (
            <SeriesCard key={s.id} series={s} read={seriesReadCount(s, progress).read} />
          ))}
        </Section>
      ) : null}

      <Section title="单篇" hint={`${shownArticles.length} 篇`}>
        {shownArticles.length === 0 && !articles.loading ? (
          <AppText variant="small" tone="textMuted">
            这个栏目还没有文章。
          </AppText>
        ) : null}
        {shownArticles.map((a) => (
          <ArticleCard key={a.id} article={a} progress={progress[a.id]} seriesTitle={seriesTitle(a.seriesId)} />
        ))}
      </Section>
    </Screen>
  );
}
