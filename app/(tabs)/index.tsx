import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';
import { useToday } from '@/hooks/useToday';
import { useDueFavorites, useStreak } from '@/store/hooks';

/** 今日 */
export default function TodayScreen() {
  const today = useToday();
  const streak = useStreak(today);
  const due = useDueFavorites(today);
  return (
    <Screen>
      <Placeholder
        title="今日"
        note={`${today} · 连续打卡 ${streak} 天 · 今天待复习 ${due.length} 个`}
        links={[{ label: '打开示例文章', href: '/article/hkp-01' }]}
      />
    </Screen>
  );
}
