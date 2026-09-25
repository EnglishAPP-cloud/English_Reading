import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 只读原文：从收藏详情跳过来，定位并高亮某一段，不影响学习进度 */
export default function TextScreen() {
  const { id, p } = useLocalSearchParams<{ id: string; p?: string }>();
  return (
    <Screen>
      <Placeholder title={`原文：${id}`} note={`整篇英文，滚动到段落 ${p ?? '（未指定）'} 并高亮。`} />
    </Screen>
  );
}
