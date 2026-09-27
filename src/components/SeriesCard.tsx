import { router } from 'expo-router';

import type { Series } from '@/content/types';

import { AppText } from './AppText';
import { Card } from './Card';
import { Row } from './Row';

/** 系列卡片：书名、作者、"已读 x / 共 y 期"。点了进系列详情 */
export function SeriesCard({ series, read }: { series: Series; read: number }) {
  return (
    <Card onPress={() => router.push({ pathname: '/series/[id]', params: { id: series.id } })}>
      <AppText variant="caption" tone="textMuted">
        拆书系列 · {series.author}
      </AppText>
      <AppText variant="enHeading">{series.titleEn}</AppText>
      <AppText variant="small" tone="textSubtle">
        {series.oneLiner}
      </AppText>
      <Row spread>
        <AppText variant="caption" tone="textMuted">
          {series.titleZh}
        </AppText>
        <AppText variant="caption" tone="primary">
          已读 {read} / 共 {series.total} 期
        </AppText>
      </Row>
    </Card>
  );
}
