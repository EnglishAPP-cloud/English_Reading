/**
 * 内容类型：全部从 zod schema 推出来，不要在这里手写字段。
 * 要改字段去改 schema.ts。
 */
import type { z } from 'zod';

import type {
  ArticleSchema,
  CheckQuestionSchema,
  ColumnSchema,
  HardSentenceSchema,
  HeadingsSchema,
  ParagraphSchema,
  ParaphraseQuestionSchema,
  SeriesIssueSchema,
  SeriesSchema,
  VocabItemSchema,
} from './schema';

export type Column = z.infer<typeof ColumnSchema>;
export type Paragraph = z.infer<typeof ParagraphSchema>;
export type VocabItem = z.infer<typeof VocabItemSchema>;
export type HardSentence = z.infer<typeof HardSentenceSchema>;
export type ParaphraseQuestion = z.infer<typeof ParaphraseQuestionSchema>;
export type CheckQuestion = z.infer<typeof CheckQuestionSchema>;
export type Headings = z.infer<typeof HeadingsSchema>;
export type Article = z.infer<typeof ArticleSchema>;

export type SeriesIssue = z.infer<typeof SeriesIssueSchema>;
export type Series = z.infer<typeof SeriesSchema>;

/** 栏目的中文名 */
export const COLUMN_LABELS: Record<Column, string> = {
  thought: '思想',
  news: '资讯',
  pro: '专业',
};

/** 难度的中文名 */
export const LEVEL_LABELS: Record<Article['level'], string> = {
  cet4: '四级',
  cet6: '六级',
};
