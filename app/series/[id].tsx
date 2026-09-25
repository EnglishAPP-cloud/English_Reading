import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 系列详情 */
export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Placeholder
        title={`系列：${id}`}
        note="一句话介绍、适合什么时候读、关键洞察、思维导图、各期目录、名词卡。"
        links={[{ label: '第 1 期', href: '/article/hkp-01' }]}
      />
    </Screen>
  );
}
