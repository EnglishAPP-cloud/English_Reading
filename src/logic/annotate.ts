/**
 * 给段落英文"打标记"：重点词、长难句、读准题的答案句。
 *
 * 页面不自己找位置，而是拿到切好的片段逐段渲染：
 *   segmentText(段落, 标记) → [{ text: 'The writer ...', marks: [] }, { text: 'register', marks: [词标记] }, ...]
 * 一个片段可能同时在长难句里、又是一个重点词，marks 里会有两个。
 */
import type { Article, Paragraph } from '@/content/types';

import { findWholeWord } from './text';

export type MarkKind = 'vocab' | 'sentence' | 'answer';

export interface Mark {
  kind: MarkKind;
  /** 在 article.vocab / sentences / questions 里的下标 */
  ref: number;
  start: number; // 起点（含）
  end: number; // 终点（不含）
}

export interface Segment {
  text: string;
  /** 覆盖这个片段的所有标记 */
  marks: Mark[];
}

/** 找出一段里要标的位置。找不到的（内容校验通过时不会发生）直接跳过 */
export function paragraphMarks(
  article: Pick<Article, 'vocab' | 'sentences' | 'questions'>,
  paragraph: Paragraph,
  include: { vocab?: boolean; sentences?: boolean; answers?: boolean },
): Mark[] {
  const marks: Mark[] = [];
  const en = paragraph.en;
  if (include.vocab) {
    article.vocab.forEach((v, ref) => {
      if (v.paragraphId !== paragraph.id) return;
      const start = findWholeWord(en, v.word);
      if (start >= 0) marks.push({ kind: 'vocab', ref, start, end: start + v.word.length });
    });
  }
  if (include.sentences) {
    article.sentences.forEach((s, ref) => {
      if (s.paragraphId !== paragraph.id) return;
      const start = en.indexOf(s.text);
      if (start >= 0) marks.push({ kind: 'sentence', ref, start, end: start + s.text.length });
    });
  }
  if (include.answers) {
    article.questions.forEach((q, ref) => {
      if (q.paragraphId !== paragraph.id) return;
      const start = en.indexOf(q.answer);
      if (start >= 0) marks.push({ kind: 'answer', ref, start, end: start + q.answer.length });
    });
  }
  return marks;
}

/** 在所有标记的起止位置把文字切开，每个片段带上覆盖它的标记 */
export function segmentText(text: string, marks: readonly Mark[]): Segment[] {
  const cuts = new Set<number>([0, text.length]);
  for (const m of marks) {
    cuts.add(Math.max(0, Math.min(text.length, m.start)));
    cuts.add(Math.max(0, Math.min(text.length, m.end)));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]!;
    const end = points[i + 1]!;
    if (end <= start) continue;
    out.push({ text: text.slice(start, end), marks: marks.filter((m) => m.start <= start && m.end >= end) });
  }
  return out;
}

/** 片段上某种标记（没有返回 undefined） */
export function markOf(segment: Segment, kind: MarkKind): Mark | undefined {
  return segment.marks.find((m) => m.kind === kind);
}
