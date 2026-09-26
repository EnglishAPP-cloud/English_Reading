import { StyleSheet, TextInput } from 'react-native';

import type { Article } from '@/content/types';
import { formatMonthDay, toLocalDate } from '@/logic/date';
import { FEEDBACK_TAGS, type ArticleProgress } from '@/logic/flow';
import { useUserStore } from '@/store/userStore';
import { borderWidth, colors, radius, space, textVariants } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Notice } from '../Notice';
import { Row } from '../Row';
import { Section } from '../Section';

/** 三种练法共同的部分：一句话输出、本周小练习、读后反馈、"读完了" */
export function CommonPractice({ article, progress }: { article: Article; progress: ArticleProgress }) {
  const setOutputText = useUserStore((s) => s.setOutputText);
  const toggleFeedback = useUserStore((s) => s.toggleFeedback);
  const completeArticle = useUserStore((s) => s.completeArticle);

  return (
    <>
      <Section title="一句话输出">
        <TextInput
          style={styles.input}
          value={progress.outputText}
          onChangeText={(t) => setOutputText(article.id, t)}
          placeholder={article.output.template}
          placeholderTextColor={colors.textMuted}
          multiline
          autoCapitalize="sentences"
        />
        <AppText variant="caption" tone="textMuted">
          范例：{article.output.example}
        </AppText>
      </Section>

      <Section title="本周小练习">
        <Notice>
          <AppText variant="small">{article.action}</AppText>
        </Notice>
      </Section>

      <Section title="读后反馈" hint="可多选">
        <Row wrap gap="sm">
          {FEEDBACK_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={progress.feedback.includes(tag)}
              onPress={() => toggleFeedback(article.id, tag)}
            />
          ))}
        </Row>
      </Section>

      {progress.completedAt ? (
        <Notice color={colors.success} softColor={colors.successSoft}>
          <AppText variant="subheading" tone="success">
            ✓ 已完成 · {formatMonthDay(toLocalDate(new Date(progress.completedAt)))}
          </AppText>
          <AppText variant="small" tone="textSubtle">
            收藏的词和句子明天会出现在复习里。
          </AppText>
        </Notice>
      ) : (
        <Button block title="读完了" onPress={() => completeArticle(article.id)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    ...textVariants.enBody,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: space.xxxl + space.lg,
  },
});
