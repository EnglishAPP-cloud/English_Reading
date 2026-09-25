import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConfirmButton } from '@/components/ConfirmButton';
import { reviewStateLabel } from '@/components/FavoriteRow';
import { Loading } from '@/components/Loading';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { useArticle } from '@/content/hooks';
import { formatMonthDay } from '@/logic/date';
import { speakWord } from '@/hooks/useSpeech';
import { useUserStore } from '@/store/userStore';
import { colors, radius, space } from '@/theme';

/** 收藏详情：词或句子的完整信息、复习状态；能跳回原文那一段 */
export default function FavoriteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const favorite = useUserStore((s) => (id ? s.favorites[id] : undefined));
  const removeFavorite = useUserStore((s) => s.removeFavorite);
  const { data: article } = useArticle(favorite?.articleId);

  if (!favorite) return <Loading message="这条收藏已经取消了。" />;

  const openText = () =>
    router.push({ pathname: '/text/[id]', params: { id: favorite.articleId, p: favorite.paragraphId } });

  return (
    <Screen>
      {favorite.kind === 'word' ? (
        <>
          <Row gap="sm" wrap style={styles.baseline}>
            <AppText variant="enDisplay">{favorite.lemma}</AppText>
            <AppText variant="small" tone="textMuted">
              {favorite.phonetic}
            </AppText>
          </Row>
          {favorite.word !== favorite.lemma ? (
            <AppText variant="caption" tone="textMuted">
              原文写法：{favorite.word}
            </AppText>
          ) : null}
          <AppText variant="body">{favorite.meaning}</AppText>
          <View style={styles.box}>
            <AppText variant="enBody" tone="textSubtle">
              {favorite.sentence}
            </AppText>
          </View>
        </>
      ) : (
        <>
          <View style={styles.box}>
            <AppText variant="enBody">{favorite.text}</AppText>
          </View>
          <AppText variant="body" tone="textSubtle">
            {favorite.translation}
          </AppText>
        </>
      )}

      <View style={styles.meta}>
        <AppText variant="caption" tone="textMuted">
          出自：{article ? article.titleEn : favorite.articleId}
        </AppText>
        <AppText variant="caption" tone="textMuted">
          收藏于 {formatMonthDay(favorite.addedAt)}
          {favorite.lastReviewedAt ? ` · 上次复习 ${formatMonthDay(favorite.lastReviewedAt)}` : ''}
        </AppText>
        <AppText variant="caption" tone="textMuted">
          {reviewStateLabel(favorite)}
        </AppText>
      </View>

      <Row wrap gap="sm">
        <Button title="回到原文那一段" onPress={openText} />
        {favorite.kind === 'word' ? (
          <Button variant="secondary" title="发音" onPress={() => speakWord(favorite.lemma)} />
        ) : null}
        <ConfirmButton
          title="取消收藏"
          confirmTitle="确认取消收藏"
          onConfirm={() => {
            removeFavorite(favorite.id);
            router.back();
          }}
        />
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  baseline: { alignItems: 'baseline' },
  box: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: space.md },
  meta: { gap: space.xxs },
});
