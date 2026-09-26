import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FavoriteRow } from '@/components/FavoriteRow';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useToday } from '@/hooks/useToday';
import { MASTERED_LEVEL, REVIEW_INTERVALS } from '@/logic/review';
import { useDueFavorites, useFavoritesByMastery } from '@/store/hooks';

/** 单词：今天要复习几个 + 开始复习；下面分"学习中 / 已掌握"列出全部收藏 */
export default function WordsScreen() {
  const today = useToday();
  const due = useDueFavorites(today);
  const { learning, mastered } = useFavoritesByMastery();
  const empty = learning.length + mastered.length === 0;

  return (
    <Screen>
      <Card>
        <AppText variant="heading">今天要复习 {due.length} 个</AppText>
        <AppText variant="small" tone="textMuted">
          收藏的词和句子会在第二天推回来，按 {REVIEW_INTERVALS.join(' / ')} 天的间隔复习。
        </AppText>
        <Button title="开始复习" disabled={due.length === 0} onPress={() => router.push('/review')} />
      </Card>

      {empty ? (
        <AppText variant="small" tone="textMuted">
          还没有收藏。在文章练习的「精读补上」里，点虚线单词或蓝底长难句就能收藏。
        </AppText>
      ) : (
        <>
          <Section title="学习中" hint={`${learning.length} 个`}>
            {learning.map((f) => (
              <FavoriteRow key={f.id} favorite={f} />
            ))}
          </Section>
          <Section title="已掌握" hint={`${mastered.length} 个`}>
            {mastered.length === 0 ? (
              <AppText variant="small" tone="textMuted">
                连续记得 {MASTERED_LEVEL} 次就算掌握。
              </AppText>
            ) : (
              mastered.map((f) => <FavoriteRow key={f.id} favorite={f} />)
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}
