import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 文章页：定向 → 裸读 → 检测 → 练习，四步都在这一页里切换 */
export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Placeholder
        title={`文章：${id}`}
        note="四步学习流程：定向 → 裸读 → 检测 → 练习。"
        links={[{ label: '只读原文（第 2 段）', href: `/text/${id}?p=p2` }]}
      />
    </Screen>
  );
}
