import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type TextStyle } from 'react-native';

import type { Paragraph } from '@/content/types';
import { markOf, segmentText, type Mark } from '@/logic/annotate';
import { borderWidth, colors, radius, space, textVariants } from '@/theme';

import { AppText } from '../AppText';

type Props = {
  paragraph: Paragraph;
  /** 第几段（从 0 开始），显示为 ¶1、¶2… */
  index: number;
  /** 要标出的位置（重点词 / 长难句 / 读准答案）；不传 = 纯文本 */
  marks?: readonly Mark[];
  /** 已收藏的重点词（vocab 下标） */
  savedVocab?: ReadonlySet<number>;
  /** 已标出的读准答案（questions 下标）；没标出的答案不显示任何样式 */
  revealedAnswers?: ReadonlySet<number>;
  onPressVocab?: (ref: number) => void;
  onPressSentence?: (ref: number) => void;
  /** 整段高亮（朗读中、从收藏跳过来） */
  highlighted?: boolean;
  /** 正文上方（挑战的小标题下拉框） */
  above?: ReactNode;
  /** 正文下方（中文大意、长难句拆解） */
  below?: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
};

/** 一段英文：按标记切片渲染，重点词可点、长难句可点、答案句高亮 */
export function ParagraphView({
  paragraph,
  index,
  marks = [],
  savedVocab,
  revealedAnswers,
  onPressVocab,
  onPressSentence,
  highlighted,
  above,
  below,
  onLayout,
}: Props) {
  const segments = segmentText(paragraph.en, marks);

  return (
    <View style={[styles.row, highlighted && styles.highlighted]} onLayout={onLayout}>
      <AppText variant="enSmall" tone="textMuted" style={styles.number}>
        ¶{index + 1}
      </AppText>
      <View style={styles.body}>
        {above}
        <Text style={[textVariants.enReading, { color: colors.text }]}>
          {segments.map((seg, i) => {
            const vocab = markOf(seg, 'vocab');
            const sentence = markOf(seg, 'sentence');
            const answer = markOf(seg, 'answer');
            const style: TextStyle[] = [];
            if (sentence) style.push(styles.sentence);
            if (answer && revealedAnswers?.has(answer.ref)) style.push(styles.answer);
            if (vocab) style.push(savedVocab?.has(vocab.ref) ? styles.vocabSaved : styles.vocab);
            // 点击优先级：词 > 长难句
            const onPress = vocab && onPressVocab
              ? () => onPressVocab(vocab.ref)
              : sentence && onPressSentence
                ? () => onPressSentence(sentence.ref)
                : undefined;
            return (
              <Text key={i} style={style} onPress={onPress} suppressHighlighting={false}>
                {seg.text}
              </Text>
            );
          })}
        </Text>
        {below}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.sm,
    paddingVertical: space.xs,
    paddingRight: space.xs,
    borderRadius: radius.sm,
    // 左边框一直占位（透明），高亮时只换颜色，文字不会跳动
    borderLeftWidth: borderWidth.thick,
    borderLeftColor: 'transparent',
  },
  highlighted: { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.primary },
  number: { width: space.xl + space.xs, paddingTop: space.xxs, textAlign: 'right' },
  body: { flex: 1, gap: space.sm },
  sentence: { backgroundColor: colors.infoSoft },
  answer: { backgroundColor: colors.successSoft },
  vocab: {
    color: colors.info,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: colors.info,
  },
  vocabSaved: { backgroundColor: colors.highlight, textDecorationLine: 'none' },
});
