import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 今日 */
export default function TodayScreen() {
  return (
    <Screen>
      <Placeholder
        title="今日"
        note="今天该读的一篇、连续打卡天数、今天待复习数。"
        links={[{ label: '打开示例文章', href: '/article/hkp-01' }]}
      />
    </Screen>
  );
}
