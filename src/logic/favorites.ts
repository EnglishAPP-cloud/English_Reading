/**
 * 收藏：词和句子。
 *
 * - 词：一个 lemma 只存一条，以第一次收藏为准，不会被别的文章覆盖
 * - 句子：按"文章 + 原句"区分
 * - 收藏项把要显示的内容（释义、句子、译文）复制一份存下来，内容以后改了也不影响已收藏的
 */
import type { Article, HardSentence, VocabItem } from '@/content/types';

import type { LocalDate } from './date';
import { countDue, isDue, isMastered, newSchedule, applyGrade, type ReviewGrade, type ReviewSchedule } from './review';
import { findWholeWord, sentenceContaining } from './text';

interface FavoriteBase extends ReviewSchedule {
  id: string;
  articleId: string;
  paragraphId: string;
  createdAt: string; // 收藏的时间（ISO），同一天内排序用
}

export interface WordFavorite extends FavoriteBase {
  kind: 'word';
  lemma: string;
  word: string; // 原文写法
  phonetic: string;
  meaning: string; // 本文释义
  sentence: string; // 所在句子
}

export interface SentenceFavorite extends FavoriteBase {
  kind: 'sentence';
  text: string; // 英文原句
  translation: string; // 中文译文
}

export type Favorite = WordFavorite | SentenceFavorite;
export type FavoriteMap = Record<string, Favorite>;

/** 词收藏的 id：按 lemma（忽略大小写和首尾空格） */
export function wordFavoriteId(lemma: string): string {
  return `word:${lemma.trim().toLowerCase()}`;
}

/** 句子收藏的 id：文章 + 原句 */
export function sentenceFavoriteId(articleId: string, text: string): string {
  return `sentence:${articleId}:${text}`;
}

/** 从文章里的一个重点词生成收藏项 */
export function makeWordFavorite(article: Article, vocab: VocabItem, today: LocalDate, nowIso: string): WordFavorite {
  const paragraph = article.paragraphs.find((p) => p.id === vocab.paragraphId);
  return {
    kind: 'word',
    id: wordFavoriteId(vocab.lemma),
    lemma: vocab.lemma,
    word: vocab.word,
    phonetic: vocab.phonetic,
    meaning: vocab.meaning,
    sentence: paragraph ? sentenceContaining(paragraph.en, vocab.word) : '',
    articleId: article.id,
    paragraphId: vocab.paragraphId,
    createdAt: nowIso,
    ...newSchedule(today),
  };
}

/** 从文章里的一个长难句生成收藏项 */
export function makeSentenceFavorite(
  article: Article,
  sentence: HardSentence,
  today: LocalDate,
  nowIso: string,
): SentenceFavorite {
  return {
    kind: 'sentence',
    id: sentenceFavoriteId(article.id, sentence.text),
    text: sentence.text,
    translation: sentence.translation,
    articleId: article.id,
    paragraphId: sentence.paragraphId,
    createdAt: nowIso,
    ...newSchedule(today),
  };
}

/** 加入收藏；已经有同 id 的就保持原样（第一次为准） */
export function addFavorite(favorites: FavoriteMap, fav: Favorite): FavoriteMap {
  return favorites[fav.id] ? favorites : { ...favorites, [fav.id]: fav };
}

/** 取消收藏 */
export function removeFavorite(favorites: FavoriteMap, id: string): FavoriteMap {
  if (!favorites[id]) return favorites;
  const next = { ...favorites };
  delete next[id];
  return next;
}

/**
 * "上次遇到"：这个 lemma 收藏过就返回当时的收藏（里面有那句话和日期），没有返回 undefined
 * （页面显示"第一次遇到这个词"）。
 */
export function lastEncounter(favorites: FavoriteMap, lemma: string): WordFavorite | undefined {
  const f = favorites[wordFavoriteId(lemma)];
  return f?.kind === 'word' ? f : undefined;
}

/** 复习卡的中文提示：释义去掉括号里的备注。"v. 被注意到（常见义"登记"）" → "v. 被注意到" */
export function meaningHint(meaning: string): string {
  return meaning.replace(/[（(][^（）()]*[）)]/g, '').trim();
}

/**
 * 词卡正面的挖空：把原句里的这个词换成空格。
 * 返回空格前后两段，页面在中间画一条横线；句子里找不到这个词时 found 为 false。
 */
export function blankOut(sentence: string, word: string): { before: string; after: string; found: boolean } {
  const i = findWholeWord(sentence, word);
  if (i < 0) return { before: sentence, after: '', found: false };
  return { before: sentence.slice(0, i), after: sentence.slice(i + word.length), found: true };
}

/** 单词页：分成"学习中 / 已掌握"，都是最近收藏的在前 */
export function splitByMastery(favorites: FavoriteMap): { learning: Favorite[]; mastered: Favorite[] } {
  const all = Object.values(favorites).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { learning: all.filter((f) => !isMastered(f)), mastered: all.filter((f) => isMastered(f)) };
}

/**
 * 复习评分：更新这一项的复习信息。
 * roundCompleted = 评完这张以后，今天已经没有要复习的了 → 算"复习完一轮"，当天打卡。
 * 不是今天到期的卡不能评（原样返回）。
 */
export function gradeFavorite(
  favorites: FavoriteMap,
  id: string,
  grade: ReviewGrade,
  today: LocalDate,
): { favorites: FavoriteMap; updated?: Favorite; roundCompleted: boolean } {
  const fav = favorites[id];
  if (!fav || !isDue(fav, today)) return { favorites, roundCompleted: false };
  const updated = applyGrade(fav, grade, today);
  const next = { ...favorites, [id]: updated };
  return { favorites: next, updated, roundCompleted: countDue(Object.values(next), today) === 0 };
}
