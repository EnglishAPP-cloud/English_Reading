import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';
import { useAllSeries, usePublishedArticles } from '@/content/hooks';
import { todayLocal } from '@/logic/date';

/** 知识库 */
export default function LibraryScreen() {
  const articles = usePublishedArticles(todayLocal(), false);
  const series = useAllSeries();
  const loaded = articles.data && series.data;
  return (
    <Screen>
      <Placeholder
        title="知识库"
        note={
          loaded
            ? `内容层已接通：${articles.data?.length} 篇已发布文章，${series.data?.length} 个系列。`
            : '读取内容中…'
        }
        links={[{ label: '打开示例系列', href: '/series/how-to-know-a-person' }]}
      />
    </Screen>
  );
}
