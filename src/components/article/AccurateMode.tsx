import { StyleSheet, View } from 'react-native';

import type { Article } from '@/content/types';
import { paragraphMarks } from '@/logic/annotate';
import type { ArticleProgress } from '@/logic/flow';
import type { useParagraphPositions } from '@/hooks/useParagraphPositions';
import { useUserStore } from '@/store/userStore';
import { space } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Card } from '../Card';
import { Section } from '../Section';

import { ParagraphView } from './ParagraphView';

type Positions = ReturnType<typeof useParagraphPositions>;

/** 读准：每句换了说法的句子，回原文找原句；点"在原文中标出答案"高亮原句并显示解析 */
export function AccurateMode({
  article,
  progress,
  positions,
}: {
  article: Article;
  progress: ArticleProgress;
  positions: Positions;
}) {
  const reveal = useUserStore((s) => s.revealQuestion);
  const revealed = new Set(progress.revealedQuestions);

  return (
    <>
      <View style={styles.list} onLayout={positions.onListLayout}>
        {article.paragraphs.map((p, i) => (
          <ParagraphView
            key={p.id}
            paragraph={p}
            index={i}
            marks={paragraphMarks(article, p, { answers: true })}
            revealedAnswers={revealed}
            onLayout={positions.onParagraphLayout(p.id)}
          />
        ))}
      </View>

      <Section title="回原文找原句">
        {article.questions.map((q, i) => (
          <Card key={i}>
            <AppText variant="enBody">{`${i + 1}. ${q.prompt}`}</AppText>
            {revealed.has(i) ? (
              <>
                <AppText variant="enSmall">{q.answer}</AppText>
                <AppText variant="small" tone="textSubtle">
                  {q.explanation}
                </AppText>
              </>
            ) : (
              <Button
                small
                variant="secondary"
                title="在原文中标出答案"
                onPress={() => {
                  reveal(article.id, i);
                  positions.scrollToParagraph(q.paragraphId);
                }}
              />
            )}
          </Card>
        ))}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
});
