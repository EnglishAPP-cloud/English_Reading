/**
 * 内容的 zod schema：文章（Article）和系列（Series）JSON 的"唯一标准"。
 * TypeScript 类型从这里用 z.infer 推出来（见 types.ts），所以两者不会对不上。
 *
 * 这里只管"形状"（字段有没有、类型对不对、取值在不在范围里）；
 * "对不上"的问题（词在不在段落里、下标越界、系列引用……）在 validate.ts 里查。
 *
 * 改字段 = 改这里 + 改 CLAUDE.md 里的内容格式说明。
 */
import { z } from 'zod';

import { isValidLocalDate } from '@/logic/date';

// 报错信息用中文
z.config(z.locales.zhCN());
// 不用 new Function 做加速：手机上的 Hermes 引擎不一定支持，关掉更稳（内容量小，没有性能影响）
z.config({ jitless: true });

/** 不能是空字符串 */
const text = z.string().min(1, '不能为空');

/** 文章 / 系列的 id：小写字母、数字、连字符，比如 hkp-01 */
const contentId = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id 只能用小写字母、数字和连字符，比如 hkp-01');

/** 段落 id：字母、数字、下划线、连字符，比如 p1 */
const paragraphId = z.string().regex(/^[A-Za-z0-9_-]+$/, '段落 id 只能用字母、数字、下划线和连字符，比如 p1');

/** 本地日期 YYYY-MM-DD（isValidLocalDate 同时检查格式和日期是否真实存在） */
const localDate = z.string().refine(isValidLocalDate, '应为真实存在的日期，格式 YYYY-MM-DD，比如 2026-09-25');

const positiveInt = z.number().int().positive();

// ———————————————————— 文章 ————————————————————

/** 栏目：思想 / 资讯 / 专业 */
export const ColumnSchema = z.enum(['thought', 'news', 'pro']);

/** 难度：四级 / 六级（要加考研、雅思等，改这里） */
export const ArticleLevelSchema = z.enum(['cet4', 'cet6']);

export const ParagraphSchema = z.strictObject({
  id: paragraphId,
  en: text, // 英文原文
  zh: text, // 中文大意
});

/** 重点词 */
export const VocabItemSchema = z.strictObject({
  word: text, // 原文写法，必须作为完整单词原样出现在对应段落里
  lemma: text, // 词元，收藏和"上次遇到"按它归并
  phonetic: text,
  meaning: text, // 本文释义
  level: text, // 展示用，比如"四级 · 熟词僻义"
  paragraphId,
});

/** 长难句 */
export const HardSentenceSchema = z.strictObject({
  paragraphId,
  text, // 必须是对应段落英文的原样子串
  analysis: z.array(text).min(1),
  translation: text,
});

/** 读准练法的同义改写题：prompt 是改写后的句子，answer 是原文里的原句 */
export const ParaphraseQuestionSchema = z.strictObject({
  prompt: text,
  answer: text, // 必须是对应段落英文的原样子串
  paragraphId,
  explanation: text,
});

/** 检测选择题 */
export const CheckQuestionSchema = z.strictObject({
  type: text, // 题型，比如"主旨""推断"
  prompt: text,
  options: z.array(text).min(2),
  answer: z.number().int().min(0), // 正确选项的下标，从 0 开始
  explanation: text,
});

/** 挑战练法：给每段选小标题 */
export const HeadingsSchema = z.strictObject({
  options: z.array(text).min(1),
  answers: z.record(paragraphId, z.number().int().min(0)), // 段落 id → 正确选项下标
  note: text.optional(),
});

export const ArticleSchema = z.strictObject({
  id: contentId, // 必须和文件名一致
  column: ColumnSchema,
  seriesId: contentId.optional(), // 属于某个系列时填写，和 seriesIndex 要么都写要么都不写
  seriesIndex: positiveInt.optional(), // 第几期
  titleEn: text,
  titleZh: text,
  level: ArticleLevelSchema,
  wordCount: positiveInt,
  minutes: positiveInt,
  publishAt: localDate, // 发布日期，晚于今天的文章不显示
  sourceNote: text,
  intro: text.optional(), // 中文导读，暂时不用
  paragraphs: z.array(ParagraphSchema).min(1),
  vocab: z.array(VocabItemSchema),
  sentences: z.array(HardSentenceSchema),
  questions: z.array(ParaphraseQuestionSchema),
  output: z.strictObject({ template: text, example: text }), // 一句话输出
  action: text, // 本周小练习
  orientation: z.strictObject({ background: text, question: text }), // 定向
  rawReadSeconds: positiveInt, // 裸读倒计时秒数
  check: z.array(CheckQuestionSchema).min(1),
  headings: HeadingsSchema,
});

// ———————————————————— 系列 ————————————————————

/** 系列里的一期 */
export const SeriesIssueSchema = z.strictObject({
  index: positiveInt, // 第几期
  articleId: contentId.optional(), // 对应的文章；status 为 ready 时必须写
  titleEn: text,
  titleZh: text,
  chapters: text, // 对应原书章节
  level: text, // 展示用
  status: z.enum(['ready', 'soon']), // ready = 内容已完成；soon = 还在写
});

export const SeriesSchema = z.strictObject({
  id: contentId, // 必须和文件名一致
  titleEn: text,
  titleZh: text,
  author: text,
  year: z.number().int(),
  total: positiveInt, // 计划一共几期
  oneLiner: text, // 一句话介绍
  scenarios: z.array(text), // 什么时候适合读
  insights: z.array(z.strictObject({ claim: text, detail: text })), // 关键洞察
  issues: z.array(SeriesIssueSchema).min(1), // 各期目录
  glossary: z.array(z.strictObject({ en: text, zh: text, note: text, issue: positiveInt })), // 名词卡
  sourceNote: text,
  mindmap: z.strictObject({
    root: text,
    rootZh: text,
    branches: z.array(z.strictObject({ issue: positiveInt, title: text, leaves: z.array(text) })),
  }),
});
