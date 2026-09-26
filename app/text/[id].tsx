import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/AppText';
import { ParagraphView } from '@/components/article/ParagraphView';
import { Chip } from '@/components/Chip';
import { Loading } from '@/components/Loading';
import { Screen } from '@/components/Screen';
import { useArticle } from '@/content/hooks';
import { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { space } from '@/theme';

/**
 * 只读原文：从收藏详情跳过来，高亮并滚动到 ?p= 指定的段落。
 * 只是看原文，不影响这篇的学习进度。
 */
export default function TextScreen() {
  const { id, p } = useLocalSearchParams<{ id: string; p?: string }>();
  const { data: article, loading } = useArticle(id);
  const [showZh, setShowZh] = useState(false);
  const positions = useParagraphPositions();
  const scrolled = useRef(false);

  // 目标段落量好位置后滚过去（只滚一次）
  const { onParagraphLayout, scrollToParagraph } = positions;
  const onLayoutFor = useCallback(
    (pid: string) => (e: LayoutChangeEvent) => {
      onParagraphLayout(pid)(e);
      if (pid === p && !scrolled.current) {
        scrolled.current = true;
        // 稍等一下，让段落列表自己的位置也量好
        setTimeout(() => scrollToParagraph(pid), 100);
      }
    },
    [onParagraphLayout, scrollToParagraph, p],
  );

  if (loading) return <Loading />;
  if (!article) return <Loading message="找不到这篇文章。" />;

  return (
    <Screen scrollRef={positions.scrollRef}>
      <Stack.Screen options={{ title: '原文' }} />
      <View style={styles.header}>
        <AppText variant="enTitle">{article.titleEn}</AppText>
        <AppText variant="small" tone="textMuted">
          {article.titleZh}
        </AppText>
      </View>
      <View style={styles.row}>
        <Chip label="显示中文大意" selected={showZh} onPress={() => setShowZh(!showZh)} />
      </View>
      <View style={styles.list} onLayout={positions.onListLayout}>
        {article.paragraphs.map((para, i) => (
          <ParagraphView
            key={para.id}
            paragraph={para}
            index={i}
            highlighted={para.id === p}
            onLayout={onLayoutFor(para.id)}
            below={
              showZh ? (
                <AppText variant="small" tone="textSubtle">
                  {para.zh}
                </AppText>
              ) : null
            }
          />
        ))}
      </View>
      <AppText variant="caption" tone="textMuted">
        {article.sourceNote}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  row: { flexDirection: 'row' },
  list: { gap: space.md },
});
