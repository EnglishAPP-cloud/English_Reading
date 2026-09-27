import { StyleSheet, View } from 'react-native';

import type { Article, VocabItem } from '@/content/types';
import { formatMonthDay } from '@/logic/date';
import { lastEncounter, wordFavoriteId } from '@/logic/favorites';
import { sentenceContaining } from '@/logic/text';
import { speakWord } from '@/hooks/useSpeech';
import { useUserStore } from '@/store/userStore';
import { colors, modeColors, radius, space } from '@/theme';

import { AppText } from '../AppText';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Row } from '../Row';

type Props = {
  article: Article;
  vocab: VocabItem | undefined;
  onClose: () => void;
};

/** 点重点词弹出的底部卡片：音标、本文释义、级别、所在句子、上次遇到、收藏 */
export function WordSheet({ article, vocab, onClose }: Props) {
  const favorites = useUserStore((s) => s.favorites);
  const toggle = useUserStore((s) => s.toggleWordFavorite);
  if (!vocab) return <BottomSheet visible={false} onClose={onClose}>{null}</BottomSheet>;

  const paragraph = article.paragraphs.find((p) => p.id === vocab.paragraphId);
  const context = paragraph ? sentenceContaining(paragraph.en, vocab.word) : '';
  const previous = lastEncounter(favorites, vocab.lemma);
  const saved = !!favorites[wordFavoriteId(vocab.lemma)];

  return (
    <BottomSheet visible onClose={onClose}>
      <Row gap="sm" wrap style={styles.baseline}>
        <AppText variant="enTitle">{vocab.lemma}</AppText>
        <AppText variant="small" tone="textMuted">
          {vocab.phonetic}
        </AppText>
      </Row>
      <AppText variant="body">{vocab.meaning}</AppText>
      <View style={styles.level}>
        <AppText variant="caption" style={{ color: modeColors.accurate.main }}>
          {vocab.level}
        </AppText>
      </View>
      <View style={styles.context}>
        <AppText variant="enBody" tone="textSubtle">
          {context}
        </AppText>
      </View>
      <AppText variant="caption" tone="textMuted">
        {previous
          ? `上次遇到（${formatMonthDay(previous.addedAt)} 收藏）：“${previous.sentence}”`
          : '第一次遇到这个词。收藏后，下次在别的文章里再碰到它，这里会显示上次那句话。'}
      </AppText>
      <Row gap="sm">
        <Button title="发音" variant="secondary" onPress={() => speakWord(vocab.lemma)} />
        <Button
          title={saved ? '已收藏 · 取消收藏' : '＋ 收藏这个词'}
          variant={saved ? 'ghost' : 'primary'}
          onPress={() => {
            toggle(article, vocab);
            onClose();
          }}
        />
      </Row>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  baseline: { alignItems: 'baseline' },
  level: {
    alignSelf: 'flex-start',
    backgroundColor: modeColors.accurate.soft,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
  },
  context: { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: space.md },
});
