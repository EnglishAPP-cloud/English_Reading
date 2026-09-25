import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { formatMonthDay } from '@/logic/date';
import { meaningHint, type Favorite } from '@/logic/favorites';
import { isMastered, MASTERED_LEVEL } from '@/logic/review';
import { space } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Row } from './Row';

/** 复习状态的一句话：等级 x/6 · 下次 9月27日 / 已掌握 */
export function reviewStateLabel(f: Favorite): string {
  if (isMastered(f)) return '已掌握';
  return `等级 ${f.reviewLevel}/${MASTERED_LEVEL} · 下次复习 ${formatMonthDay(f.nextReviewDate)}`;
}

/** 单词页列表里的一项。点了进收藏详情 */
export function FavoriteRow({ favorite }: { favorite: Favorite }) {
  return (
    <Card onPress={() => router.push({ pathname: '/favorite/[id]', params: { id: favorite.id } })}>
      {favorite.kind === 'word' ? (
        <Row spread gap="md" style={styles.top}>
          <AppText variant="enHeading">{favorite.lemma}</AppText>
          <View style={styles.flex}>
            <AppText variant="small" tone="textSubtle" numberOfLines={2} style={styles.right}>
              {meaningHint(favorite.meaning)}
            </AppText>
          </View>
        </Row>
      ) : (
        <AppText variant="enSmall" numberOfLines={3}>
          {favorite.text}
        </AppText>
      )}
      <AppText variant="caption" tone="textMuted">
        {favorite.kind === 'word' ? '词' : '句子'} · {reviewStateLabel(favorite)}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-start' },
  flex: { flex: 1 },
  right: { textAlign: 'right' },
});
