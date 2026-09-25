/**
 * store 的组合测试：确认 action 把 logic 串对了（打卡、埋点、持久化的数据形状）。
 * 规则本身的细节在 src/logic/__tests__ 里测。
 */
import { sampleArticle } from '@/content/__tests__/fixtures';
import { STORAGE_KEY, useUserStore, initialUserData } from '@/store/userStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const article = sampleArticle();
const store = () => useUserStore.getState();

/** 固定"现在"，用 jest 的假时钟 */
function setNow(iso: string) {
  jest.setSystemTime(new Date(iso));
}

beforeEach(() => {
  jest.useFakeTimers();
  setNow('2026-09-25T10:00:00');
  useUserStore.setState(initialUserData());
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** 用给定答案走完检测并进入练习 */
function readTo(picks: [number, number]) {
  const id = article.id;
  store().startRawRead(id);
  store().addRawReadTime(id, 120);
  store().finishRawRead(id);
  store().pickCheckAnswer(id, 0, picks[0], 2);
  store().pickCheckAnswer(id, 1, picks[1], 2);
  store().submitCheck(article);
  store().startPractice(id);
}

describe('userStore', () => {
  it('答对 0 / 1 / 2 道分别进入精读补上 / 读准 / 挑战', () => {
    for (const [picks, mode] of [
      [[1, 1], 'deep'],
      [[2, 1], 'accurate'],
      [[2, 0], 'challenge'],
    ] as const) {
      useUserStore.setState(initialUserData());
      readTo([picks[0], picks[1]]);
      const p = store().progress[article.id]!;
      expect(p.step).toBe('practice');
      expect(p.mode).toBe(mode);
      expect(p.rawUsedSec).toBe(120);
    }
  });

  it('无效操作不会凭空建进度', () => {
    store().finishRawRead(article.id);
    expect(store().progress).toEqual({});
  });

  it('读完一篇：记录完成时间并打卡；再点不重复', () => {
    readTo([2, 0]);
    store().completeArticle(article.id);
    expect(store().progress[article.id]!.completedAt).toBeDefined();
    expect(store().checkIns).toEqual(['2026-09-25']);
    store().completeArticle(article.id);
    expect(store().checkIns).toEqual(['2026-09-25']);
  });

  it('重置一篇：进度清空，收藏和打卡保留', () => {
    readTo([2, 0]);
    store().toggleWordFavorite(article, article.vocab[0]!);
    store().completeArticle(article.id);
    store().resetArticle(article.id);
    expect(store().progress[article.id]).toBeUndefined();
    expect(Object.keys(store().favorites)).toHaveLength(1);
    expect(store().checkIns).toEqual(['2026-09-25']);
  });

  it('收藏词和句子，第二天复习；全部评完算打卡', () => {
    expect(store().toggleWordFavorite(article, article.vocab[0]!)).toBe('added');
    expect(store().toggleSentenceFavorite(article, article.sentences[0]!)).toBe('added');
    const [wordId, sentenceId] = Object.keys(store().favorites);

    // 收藏当天不能评
    store().gradeFavorite(wordId!, 'remember');
    expect(store().favorites[wordId!]!.reviewLevel).toBe(0);

    // 第二天
    setNow('2026-09-26T09:00:00');
    store().gradeFavorite(wordId!, 'remember');
    expect(store().favorites[wordId!]).toMatchObject({ reviewLevel: 1, nextReviewDate: '2026-09-28' });
    expect(store().checkIns).toEqual([]);
    store().gradeFavorite(sentenceId!, 'fuzzy');
    expect(store().favorites[sentenceId!]).toMatchObject({ reviewLevel: 0, nextReviewDate: '2026-09-27' });
    expect(store().checkIns).toEqual(['2026-09-26']);
  });

  it('再点一次是取消收藏', () => {
    store().toggleWordFavorite(article, article.vocab[0]!);
    expect(store().toggleWordFavorite(article, article.vocab[0]!)).toBe('removed');
    expect(store().favorites).toEqual({});
  });

  it('模拟日期偏移会影响"今天"', () => {
    store().toggleWordFavorite(article, article.vocab[0]!);
    const id = Object.keys(store().favorites)[0]!;
    store().shiftDevDate(1);
    store().gradeFavorite(id, 'remember');
    expect(store().favorites[id]!.lastReviewedAt).toBe('2026-09-26');
    store().resetDevDate();
    expect(store().settings.devDateOffsetDays).toBe(0);
  });

  it('埋点：开始读、检测得分、切换练法、收藏、读完、复习评分都会调用 track', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    readTo([2, 1]);
    store().switchMode(article.id, 'deep');
    store().toggleWordFavorite(article, article.vocab[0]!);
    store().completeArticle(article.id);
    setNow('2026-09-26T09:00:00');
    store().gradeFavorite(Object.keys(store().favorites)[0]!, 'remember');
    const events = log.mock.calls.filter((c) => c[0] === '[track]').map((c) => c[1]);
    expect(events).toEqual(['read_start', 'check_submit', 'mode_switch', 'favorite_add', 'read_complete', 'review_grade']);
  });
});

describe('打开文章', () => {
  it('已完成的文章回看过裸读后离开，再打开回到练习', () => {
    readTo([2, 0]);
    store().completeArticle(article.id);
    store().goToStep(article.id, 'raw');
    expect(store().progress[article.id]!.step).toBe('raw');
    store().openArticle(article.id);
    expect(store().progress[article.id]!.step).toBe('practice');
  });

  it('没读过的文章，打开不会凭空建进度', () => {
    store().openArticle(article.id);
    expect(store().progress).toEqual({});
  });
});

describe('读取本地数据失败', () => {
  it('数据损坏时不卡在空白页：标记 hydrationFailed，并把原数据另存备份', async () => {
    jest.useRealTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const AsyncStorage = require('@react-native-async-storage/async-storage') as {
      setItem(k: string, v: string): Promise<void>;
      getItem(k: string): Promise<string | null>;
      getAllKeys(): Promise<string[]>;
    };
    await AsyncStorage.setItem(STORAGE_KEY, '{这不是合法的 JSON');
    expect(store().hydrationFailed).toBe(false);
    await useUserStore.persist.rehydrate();
    await new Promise((r) => setTimeout(r, 20)); // 等备份写完
    expect(store().hydrationFailed).toBe(true);
    const backups = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(`${STORAGE_KEY}/backup-`));
    expect(backups).toHaveLength(1);
    expect(await AsyncStorage.getItem(backups[0]!)).toBe('{这不是合法的 JSON');
  });
});
