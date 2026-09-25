import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 收藏详情：词或句子的完整信息、复习状态，能跳回原文那一段 */
export default function FavoriteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Placeholder
        title={`收藏：${id}`}
        note="词：音标、释义、所在句子；句子：原文、译文；以及等级和下次复习日期。"
        links={[{ label: '跳回原文那一段', href: '/text/hkp-01?p=p2' }]}
      />
    </Screen>
  );
}
