import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { useToday } from '@/hooks/useToday';
import { blankOut, meaningHint, type Favorite } from '@/logic/favorites';
import { GRADE_LABELS, dueItems, gradeHint, type ReviewGrade } from '@/logic/review';
import { useStreak } from '@/store/hooks';
import { useUserStore } from '@/store/userStore';
import { borderWidth, colors, opacity, radius, space } from '@/theme';

const GRADES: ReviewGrade[] = ['forgot', 'fuzzy', 'remember'];

/** 卡片正面：词卡 = 原句挖空 + 中文提示；句卡 = 中文译文 */
function CardFront({ fav }: { fav: Favorite }) {
  if (fav.kind === 'sentence') {
    return (
      <>
        <AppText variant="heading">{fav.translation}</AppText>
        <AppText variant="caption" tone="textMuted">
          先试着用英文说出原句，再点卡片核对
        </AppText>
      </>
    );
  }
  const { before, after, found } = blankOut(fav.sentence, fav.word);
  return (
    <>
      <AppText variant="enReading">
        {before}
        <AppText variant="enReading" style={styles.blank}>
          {'    '}
        </AppText>
        {found ? after : ''}
      </AppText>
      <AppText variant="body" tone="textSubtle">
        提示：{meaningHint(fav.meaning)}
      </AppText>
      <AppText variant="caption" tone="textMuted">
        想出空格里的词，再点卡片核对
      </AppText>
    </>
  );
}

/** 卡片背面：词卡 = 词、音标、完整原句；句卡 = 英文原句 */
function CardBack({ fav }: { fav: Favorite }) {
  if (fav.kind === 'sentence') {
    return (
      <>
        <AppText variant="enReading">{fav.text}</AppText>
        <AppText variant="small" tone="textSubtle">
          {fav.translation}
        </AppText>
      </>
    );
  }
  return (
    <>
      <AppText variant="enTitle">
        {fav.lemma}{' '}
        <AppText variant="small" tone="textMuted">
          {fav.phonetic}
        </AppText>
      </AppText>
      <AppText variant="enReading">{fav.sentence}</AppText>
      <AppText variant="small" tone="textSubtle">
        {fav.meaning}
      </AppText>
    </>
  );
}

/** 复习：今天到期的卡依次过一遍，翻面后评分；全部评完算当天打卡 */
export default function ReviewScreen() {
  const today = useToday();
  const favorites = useUserStore((s) => s.favorites);
  const gradeFavorite = useUserStore((s) => s.gradeFavorite);
  const streak = useStreak(today);

  // 进页面时定下这一轮要复习的卡（评过的会变成"明天以后"，不会再出现在今天）
  const [queue] = useState(() => dueItems(Object.values(useUserStore.getState().favorites), today).map((f) => f.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (queue.length === 0) {
    return (
      <Screen>
        <Card>
          <AppText variant="heading">今天没有要复习的</AppText>
          <AppText variant="small" tone="textMuted">
            收藏的词和句子会在第二天出现在这里。
          </AppText>
          <Button title="返回" variant="secondary" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const currentId = queue[index];
  const fav = currentId ? favorites[currentId] : undefined;

  if (index >= queue.length || !fav) {
    return (
      <Screen>
        <Notice color={colors.success} softColor={colors.successSoft}>
          <AppText variant="heading" tone="success">
            ✓ 这一轮复习完了
          </AppText>
          <AppText variant="small" tone="textSubtle">
            今天已打卡，连续 {streak} 天。
          </AppText>
        </Notice>
        <Button title="返回" onPress={() => router.back()} />
      </Screen>
    );
  }

  const grade = (g: ReviewGrade) => {
    gradeFavorite(fav.id, g);
    setFlipped(false);
    setIndex(index + 1);
  };

  return (
    <Screen>
      <AppText variant="caption" tone="textMuted">
        {fav.kind === 'word' ? '单词' : '句子'} · {index + 1} / {queue.length}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="翻转卡片"
        onPress={() => setFlipped(!flipped)}
        style={styles.card}
      >
        {flipped ? <CardBack fav={fav} /> : <CardFront fav={fav} />}
        <AppText variant="caption" tone="textMuted" style={styles.flipHint}>
          {flipped ? '点卡片看正面' : '点卡片翻面'}
        </AppText>
      </Pressable>

      <View style={styles.grades}>
        {GRADES.map((g) => (
          <Pressable
            key={g}
            accessibilityRole="button"
            onPress={() => grade(g)}
            style={({ pressed }) => [styles.grade, pressed && styles.pressed]}
          >
            <AppText variant="subheading">{GRADE_LABELS[g]}</AppText>
            <AppText variant="caption" tone="textMuted">
              {gradeHint(fav, g, today)}
            </AppText>
          </Pressable>
        ))}
      </View>
      <AppText variant="caption" tone="textMuted">
        复习间隔：1 / 2 / 4 / 7 / 15 / 30 天。记得升一级，模糊明天再来，忘了回到第 1 天。
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: space.xxxl * 6,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: borderWidth.hairline,
    borderColor: colors.borderStrong,
    padding: space.xl,
    gap: space.md,
    justifyContent: 'center',
  },
  blank: { textDecorationLine: 'underline', textDecorationColor: colors.primary, color: colors.primary },
  flipHint: { textAlign: 'center' },
  grades: { flexDirection: 'row', gap: space.sm },
  grade: {
    flex: 1,
    alignItems: 'center',
    gap: space.xxs,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
  },
  pressed: { opacity: opacity.pressed },
});
