/**
 * 用户数据 store（zustand + persist，存在手机本地的 AsyncStorage）。
 *
 * 存什么：每篇文章的进度、收藏、打卡日期、设置。
 * 规则都在 src/logic/ 里；这里的 action 只做三件事：
 *   1. 调 logic 纯函数算出新数据
 *   2. 写回 store（自动持久化）
 *   3. 调 track() 埋点
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { track } from '@/analytics/track';
import type { Article, HardSentence, VocabItem } from '@/content/types';
import type { LocalDate } from '@/logic/date';
import {
  addFavorite,
  gradeFavorite as gradeInCollection,
  makeSentenceFavorite,
  makeWordFavorite,
  removeFavorite as removeFromCollection,
  sentenceFavoriteId,
  wordFavoriteId,
  type FavoriteMap,
} from '@/logic/favorites';
import * as flow from '@/logic/flow';
import type { ArticleProgress, PracticeMode, StepId } from '@/logic/flow';
import type { ReviewGrade } from '@/logic/review';
import { addCheckIn } from '@/logic/streak';

import { clockNow } from './clock';
import { effectiveDateOffset } from './devSettings';

export interface Settings {
  /** 开发用：显示未发布的文章 */
  previewUnpublished: boolean;
  /** 开发用：模拟日期偏移天数，正常为 0 */
  devDateOffsetDays: number;
}

/** 会被持久化的数据 */
export interface UserData {
  progress: Record<string, ArticleProgress>; // 文章 id → 进度
  favorites: FavoriteMap; // 收藏 id → 收藏项
  checkIns: LocalDate[]; // 打卡日期（去重、升序）
  settings: Settings;
}

export interface UserActions {
  // —— 学习流程 ——
  /** 打开文章页时调用：已完成的文章回到练习步骤 */
  openArticle(articleId: string): void;
  startRawRead(articleId: string): void;
  addRawReadTime(articleId: string, seconds: number): void;
  finishRawRead(articleId: string): void;
  pickCheckAnswer(articleId: string, questionIndex: number, optionIndex: number, questionCount: number): void;
  submitCheck(article: Article): void;
  startPractice(articleId: string): void;
  switchMode(articleId: string, mode: PracticeMode): void;
  goToStep(articleId: string, step: StepId): void;
  revealQuestion(articleId: string, index: number): void;
  pickHeading(articleId: string, paragraphId: string, optionIndex: number | null): void;
  checkHeadings(article: Article): void;
  resetHeadings(articleId: string): void;
  setOutputText(articleId: string, text: string): void;
  toggleFeedback(articleId: string, tag: string): void;
  completeArticle(articleId: string): void;
  resetArticle(articleId: string): void;
  // —— 收藏与复习 ——
  /** 收藏 / 取消收藏一个词，返回操作后的状态 */
  toggleWordFavorite(article: Article, vocab: VocabItem): 'added' | 'removed';
  toggleSentenceFavorite(article: Article, sentence: HardSentence): 'added' | 'removed';
  removeFavorite(id: string): void;
  gradeFavorite(id: string, grade: ReviewGrade): void;
  // —— 设置 ——
  setPreviewUnpublished(value: boolean): void;
  shiftDevDate(days: number): void;
  resetDevDate(): void;
  clearAllData(): void;
}

export type UserStore = UserData &
  UserActions & {
    /** 读取本地数据失败（数据损坏等）。不存储，只在本次运行里用来放行页面渲染 */
    hydrationFailed: boolean;
  };

export const DEFAULT_SETTINGS: Settings = { previewUnpublished: false, devDateOffsetDays: 0 };

export function initialUserData(): UserData {
  return { progress: {}, favorites: {}, checkIns: [], settings: { ...DEFAULT_SETTINGS } };
}

/** 本地存储的键名和数据版本。改了 UserData 的结构要升版本号，并在 migrate 里写升级逻辑 */
export const STORAGE_KEY = 'english-reading/user';
export const STORAGE_VERSION = 1;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => {
      // 开发用的日期偏移只在开发环境生效（见 devSettings.ts）
      const clock = () => clockNow(effectiveDateOffset(get().settings));

      /** 更新某篇文章的进度；logic 返回原对象（操作无效）时不写入 */
      const updateProgress = (articleId: string, fn: (p: ArticleProgress) => ArticleProgress) => {
        const prev = get().progress[articleId] ?? flow.createProgress();
        const next = fn(prev);
        if (next === prev) return { prev, next, changed: false };
        set((s) => ({ progress: { ...s.progress, [articleId]: next } }));
        return { prev, next, changed: true };
      };

      const toggleFavorite = (id: string, make: () => ReturnType<typeof makeWordFavorite> | ReturnType<typeof makeSentenceFavorite>) => {
        const existing = get().favorites[id];
        if (existing) {
          set((s) => ({ favorites: removeFromCollection(s.favorites, id) }));
          track('favorite_remove', { id, kind: existing.kind, articleId: existing.articleId });
          return 'removed' as const;
        }
        const fav = make();
        set((s) => ({ favorites: addFavorite(s.favorites, fav) }));
        track('favorite_add', { id, kind: fav.kind, articleId: fav.articleId });
        return 'added' as const;
      };

      return {
        ...initialUserData(),
        hydrationFailed: false,

        openArticle(articleId) {
          updateProgress(articleId, flow.progressOnOpen);
        },
        startRawRead(articleId) {
          const { changed } = updateProgress(articleId, (p) => flow.startRawRead(p, clock().nowIso));
          if (changed) track('read_start', { articleId });
        },
        addRawReadTime(articleId, seconds) {
          updateProgress(articleId, (p) => flow.addRawReadTime(p, seconds));
        },
        finishRawRead(articleId) {
          updateProgress(articleId, flow.finishRawRead);
        },
        pickCheckAnswer(articleId, questionIndex, optionIndex, questionCount) {
          updateProgress(articleId, (p) => flow.pickCheckAnswer(p, questionIndex, optionIndex, questionCount));
        },
        submitCheck(article) {
          const { next, changed } = updateProgress(article.id, (p) => flow.submitCheck(p, article.check));
          if (changed && next.checkResult) {
            track('check_submit', { articleId: article.id, ...next.checkResult });
          }
        },
        startPractice(articleId) {
          updateProgress(articleId, flow.startPractice);
        },
        switchMode(articleId, mode) {
          const { prev, next, changed } = updateProgress(articleId, (p) => flow.switchMode(p, mode));
          if (changed) {
            track('mode_switch', { articleId, from: prev.mode, to: next.mode, recommended: next.checkResult?.recommended });
          }
        },
        goToStep(articleId, step) {
          updateProgress(articleId, (p) => flow.goToStep(p, step));
        },
        revealQuestion(articleId, index) {
          updateProgress(articleId, (p) => flow.revealQuestion(p, index));
        },
        pickHeading(articleId, paragraphId, optionIndex) {
          updateProgress(articleId, (p) => flow.pickHeading(p, paragraphId, optionIndex));
        },
        checkHeadings(article) {
          updateProgress(article.id, (p) => flow.checkHeadings(p, article.paragraphs.map((x) => x.id)));
        },
        resetHeadings(articleId) {
          updateProgress(articleId, flow.resetHeadings);
        },
        setOutputText(articleId, text) {
          updateProgress(articleId, (p) => flow.setOutputText(p, text));
        },
        toggleFeedback(articleId, tag) {
          updateProgress(articleId, (p) => flow.toggleFeedback(p, tag));
        },
        completeArticle(articleId) {
          const { today, nowIso } = clock();
          const { next, changed } = updateProgress(articleId, (p) => flow.completeArticle(p, nowIso));
          if (!changed) return;
          // 读完一篇 = 当天打卡一次
          set((s) => ({ checkIns: addCheckIn(s.checkIns, today) }));
          track('read_complete', { articleId, mode: next.mode, rawUsedSec: next.rawUsedSec, feedback: next.feedback.join('|') });
        },
        resetArticle(articleId) {
          set((s) => {
            const progress = { ...s.progress };
            delete progress[articleId];
            return { progress };
          });
        },

        toggleWordFavorite(article, vocab) {
          const { today, nowIso } = clock();
          return toggleFavorite(wordFavoriteId(vocab.lemma), () => makeWordFavorite(article, vocab, today, nowIso));
        },
        toggleSentenceFavorite(article, sentence) {
          const { today, nowIso } = clock();
          return toggleFavorite(sentenceFavoriteId(article.id, sentence.text), () =>
            makeSentenceFavorite(article, sentence, today, nowIso),
          );
        },
        removeFavorite(id) {
          const existing = get().favorites[id];
          if (!existing) return;
          set((s) => ({ favorites: removeFromCollection(s.favorites, id) }));
          track('favorite_remove', { id, kind: existing.kind, articleId: existing.articleId });
        },
        gradeFavorite(id, grade) {
          const { today } = clock();
          const result = gradeInCollection(get().favorites, id, grade, today);
          if (!result.updated) return;
          set((s) => ({
            favorites: result.favorites,
            // 今天到期的全部评完 = 复习完一轮 = 当天打卡一次
            checkIns: result.roundCompleted ? addCheckIn(s.checkIns, today) : s.checkIns,
          }));
          track('review_grade', {
            id,
            kind: result.updated.kind,
            grade,
            reviewLevel: result.updated.reviewLevel,
            nextReviewDate: result.updated.nextReviewDate,
            roundCompleted: result.roundCompleted,
          });
        },

        setPreviewUnpublished(value) {
          set((s) => ({ settings: { ...s.settings, previewUnpublished: value } }));
        },
        shiftDevDate(days) {
          set((s) => ({ settings: { ...s.settings, devDateOffsetDays: s.settings.devDateOffsetDays + days } }));
        },
        resetDevDate() {
          set((s) => ({ settings: { ...s.settings, devDateOffsetDays: 0 } }));
        },
        clearAllData() {
          set(initialUserData());
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // 只存数据，不存函数
      partialize: (s): UserData => ({
        progress: s.progress,
        favorites: s.favorites,
        checkIns: s.checkIns,
        settings: s.settings,
      }),
      // 以后改数据结构：升 STORAGE_VERSION，在这里把旧版本数据转换成新结构
      migrate: (persisted) => persisted as UserData,
      // 读回来的数据和默认值合并；settings 单独合并，以后加新设置项时老用户也有默认值
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UserData>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...p.settings } };
      },
      // 读取失败（数据损坏、迁移出错）时用空数据继续，否则页面会一直停在空白的加载状态。
      // 之后的任何写入都会覆盖原来那份数据，所以先备份：
      // - 备份成功（或原来本就没数据）：照常写回原位置
      // - 备份失败：改写到另一个键，绝不覆盖原数据，留给以后排查 / 恢复
      onRehydrateStorage: () => (_state, error) => {
        if (!error) return;
        console.warn('[store] 读取本地数据失败，用空数据继续', error);
        void backupRawData().then((safe) => {
          if (!safe) useUserStore.persist.setOptions({ name: `${STORAGE_KEY}/unsaved` });
          useUserStore.setState({ hydrationFailed: true });
        });
      },
    },
  ),
);

/** 把本地原始数据另存一份。返回 true = 可以放心覆盖原数据（备份成功，或者原来就没数据） */
async function backupRawData(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    await AsyncStorage.setItem(`${STORAGE_KEY}/backup-${Date.now()}`, raw);
    return true;
  } catch {
    return false;
  }
}
