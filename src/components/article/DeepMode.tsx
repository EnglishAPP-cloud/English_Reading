import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { paragraphMarks } from '@/logic/annotate';
import { sentenceFavoriteId, wordFavoriteId } from '@/logic/favorites';
import type { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { useParagraphSpeech } from '@/hooks/useSpeech';
import { useUserStore } from '@/store/userStore';
import { borderWidth, colors, modeColors, radius, space } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Row } from '../Row';

import { ParagraphView } from './ParagraphView';
import { WordSheet } from './WordSheet';

type Positions = ReturnType<typeof useParagraphPositions>;

/**
 * 精读补上：
 * - "基础"开关：每段下面显示中文大意
 * - "进阶"开关：标出重点词（点开底部卡片）和长难句（点开拆解和译文）
 * - 朗读：按段读，读到哪段高亮哪段
 * 两个开关默认都开，不保存。
 */
export function DeepMode({ article, positions }: { article: Article; positions: Positions }) {
  const [basic, setBasic] = useState(true);
  const [advanced, setAdvanced] = useState(true);
  const [openSentences, setOpenSentences] = useState<ReadonlySet<number>>(new Set());
  const [sheetVocab, setSheetVocab] = useState<number | null>(null);
  const favorites = useUserStore((s) => s.favorites);
  const toggleSentenceFavorite = useUserStore((s) => s.toggleSentenceFavorite);

  const texts = useMemo(() => article.paragraphs.map((p) => p.en), [article]);
  const speech = useParagraphSpeech(texts);
  const { scrollToParagraph } = positions;

  // 读到哪段，就滚到哪段
  useEffect(() => {
    const p = speech.speakingIndex === null ? undefined : article.paragraphs[speech.speakingIndex];
    if (p) scrollToParagraph(p.id);
  }, [speech.speakingIndex, article, scrollToParagraph]);

  const savedVocab = useMemo(
    () => new Set(article.vocab.flatMap((v, i) => (favorites[wordFavoriteId(v.lemma)] ? [i] : []))),
    [article, favorites],
  );

  const toggleOpen = (ref: number) =>
    setOpenSentences((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });

  return (
    <>
      <Row wrap gap="sm">
        <Chip
          label="基础 · 中文大意"
          selected={basic}
          onPress={() => setBasic(!basic)}
          color={modeColors.accurate.main}
          softColor={modeColors.accurate.soft}
        />
        <Chip
          label="进阶 · 词和长难句"
          selected={advanced}
          onPress={() => setAdvanced(!advanced)}
          color={colors.info}
          softColor={colors.infoSoft}
        />
        <Button small title={speech.speaking ? '■ 停止' : '▶ 朗读'} onPress={speech.speaking ? speech.stop : speech.start} />
      </Row>

      <View style={styles.list} onLayout={positions.onListLayout}>
        {article.paragraphs.map((p, i) => {
          const sentencesHere = article.sentences
            .map((s, ref) => ({ s, ref }))
            .filter(({ s, ref }) => s.paragraphId === p.id && openSentences.has(ref));
          return (
            <ParagraphView
              key={p.id}
              paragraph={p}
              index={i}
              marks={advanced ? paragraphMarks(article, p, { vocab: true, sentences: true }) : []}
              savedVocab={savedVocab}
              onPressVocab={advanced ? setSheetVocab : undefined}
              onPressSentence={advanced ? toggleOpen : undefined}
              highlighted={speech.speakingIndex === i}
              onLayout={positions.onParagraphLayout(p.id)}
              below={
                <>
                  {basic ? (
                    <View style={styles.gloss}>
                      <AppText variant="small" tone="textSubtle">
                        {p.zh}
                      </AppText>
                    </View>
                  ) : null}
                  {advanced
                    ? sentencesHere.map(({ s, ref }) => {
                        const saved = !!favorites[sentenceFavoriteId(article.id, s.text)];
                        return (
                          <View key={ref} style={styles.analysis}>
                            <AppText variant="caption" tone="info">
                              长难句拆解
                            </AppText>
                            {s.analysis.map((line, k) => (
                              <AppText key={k} variant="small">
                                · {line}
                              </AppText>
                            ))}
                            <AppText variant="small" tone="textSubtle">
                              译文：{s.translation}
                            </AppText>
                            <Button
                              small
                              variant={saved ? 'ghost' : 'secondary'}
                              title={saved ? '已收藏这句 · 取消' : '＋ 收藏这句'}
                              onPress={() => toggleSentenceFavorite(article, s)}
                            />
                          </View>
                        );
                      })
                    : null}
                </>
              }
            />
          );
        })}
      </View>

      <WordSheet
        article={article}
        vocab={sheetVocab === null ? undefined : article.vocab[sheetVocab]}
        onClose={() => setSheetVocab(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  gloss: {
    borderLeftWidth: borderWidth.thick,
    borderLeftColor: modeColors.accurate.main,
    backgroundColor: modeColors.accurate.soft,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  analysis: {
    borderWidth: borderWidth.hairline,
    borderColor: colors.info,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
  },
});
