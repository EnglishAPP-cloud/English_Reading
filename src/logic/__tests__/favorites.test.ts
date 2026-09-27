import { sampleArticle } from '@/content/__tests__/fixtures';
import {
  addFavorite,
  blankOut,
  gradeFavorite,
  lastEncounter,
  makeSentenceFavorite,
  makeWordFavorite,
  meaningHint,
  removeFavorite,
  sentenceFavoriteId,
  splitByMastery,
  wordFavoriteId,
  type FavoriteMap,
} from '@/logic/favorites';

const TODAY = '2026-09-25';
const NOW = '2026-09-25T10:00:00.000Z';
const article = sampleArticle();
const vocab = (lemma: string) => article.vocab.find((v) => v.lemma === lemma)!;

describe('收藏', () => {
  it('收藏词：带上所在句子、音标、释义、文章和段落，等级 0、明天复习', () => {
    const f = makeWordFavorite(article, vocab('register'), TODAY, NOW);
    expect(f).toEqual({
      kind: 'word',
      id: 'word:register',
      lemma: 'register',
      word: 'register',
      phonetic: '/ˈredʒɪstə(r)/',
      meaning: 'v. 被注意到，引起注意（常见义"登记"）',
      sentence: 'Diminishers are so busy with themselves that other people barely register.',
      articleId: 'hkp-01',
      paragraphId: 'p2',
      createdAt: NOW,
      reviewLevel: 0,
      nextReviewDate: '2026-09-26',
      addedAt: TODAY,
    });
  });

  it('原文写法和 lemma 不同时，句子按原文写法找', () => {
    const f = makeWordFavorite(article, vocab('illuminator'), TODAY, NOW);
    expect(f.word).toBe('Illuminators');
    expect(f.sentence).toBe('He calls the first kind Illuminators and the second kind Diminishers.');
  });

  it('收藏句子：原文、译文、文章和段落', () => {
    const s = article.sentences[0]!;
    const f = makeSentenceFavorite(article, s, TODAY, NOW);
    expect(f.kind).toBe('sentence');
    expect(f.id).toBe(sentenceFavoriteId('hkp-01', s.text));
    expect(f.text).toBe(s.text);
    expect(f.translation).toBe(s.translation);
    expect(f.paragraphId).toBe('p4');
    expect(f.nextReviewDate).toBe('2026-09-26');
  });

  it('同一个 lemma 只存一条，以第一次为准', () => {
    const first = makeWordFavorite(article, vocab('register'), TODAY, NOW);
    let favs: FavoriteMap = addFavorite({}, first);
    const other = { ...makeWordFavorite(article, vocab('register'), '2026-10-01', NOW), articleId: 'hkp-02' };
    favs = addFavorite(favs, other);
    expect(Object.keys(favs)).toEqual(['word:register']);
    expect(favs['word:register']).toBe(first);
  });

  it('lemma 忽略大小写和首尾空格', () => {
    expect(wordFavoriteId(' Register ')).toBe(wordFavoriteId('register'));
  });

  it('取消收藏', () => {
    const favs = addFavorite({}, makeWordFavorite(article, vocab('assume'), TODAY, NOW));
    expect(removeFavorite(favs, 'word:assume')).toEqual({});
    expect(removeFavorite(favs, 'word:nope')).toBe(favs);
  });

  it('上次遇到：收藏过就返回当时的句子和日期，没有返回 undefined', () => {
    const favs = addFavorite({}, makeWordFavorite(article, vocab('register'), TODAY, NOW));
    const hit = lastEncounter(favs, 'register');
    expect(hit?.sentence).toContain('barely register');
    expect(hit?.addedAt).toBe(TODAY);
    expect(lastEncounter(favs, 'assume')).toBeUndefined();
  });

  it('复习卡提示：释义去掉括号备注', () => {
    expect(meaningHint('v. 被注意到，引起注意（常见义"登记"）')).toBe('v. 被注意到，引起注意');
    expect(meaningHint('adj. 才华横溢的，聪明绝顶的')).toBe('adj. 才华横溢的，聪明绝顶的');
    expect(meaningHint('n. 照亮者 (本书用法)')).toBe('n. 照亮者');
  });

  it('词卡挖空：按完整单词挖掉原文写法', () => {
    expect(blankOut('Most of us assume that we are good.', 'assume')).toEqual({
      before: 'Most of us ',
      after: ' that we are good.',
      found: true,
    });
    expect(blankOut('Nothing here.', 'assume')).toEqual({ before: 'Nothing here.', after: '', found: false });
  });

  it('单词页分"学习中 / 已掌握"，最近收藏的在前', () => {
    const a = { ...makeWordFavorite(article, vocab('assume'), TODAY, '2026-09-25T01:00:00Z') };
    const b = { ...makeWordFavorite(article, vocab('brilliant'), TODAY, '2026-09-25T02:00:00Z') };
    const m = { ...makeWordFavorite(article, vocab('reserved'), TODAY, '2026-09-25T03:00:00Z'), reviewLevel: 6 };
    const { learning, mastered } = splitByMastery({ [a.id]: a, [b.id]: b, [m.id]: m });
    expect(learning.map((x) => x.id)).toEqual(['word:brilliant', 'word:assume']);
    expect(mastered.map((x) => x.id)).toEqual([m.id]);
  });
});

describe('复习评分 gradeFavorite', () => {
  const TOMORROW = '2026-09-26';
  const w = makeWordFavorite(article, vocab('register'), TODAY, NOW);
  const s = makeSentenceFavorite(article, article.sentences[0]!, TODAY, NOW);
  const favs: FavoriteMap = { [w.id]: w, [s.id]: s };

  it('收藏当天不能评（还没到期）', () => {
    const r = gradeFavorite(favs, w.id, 'remember', TODAY);
    expect(r.favorites).toBe(favs);
    expect(r.roundCompleted).toBe(false);
  });

  it('第二天评分后下次日期正确；评完最后一张算复习完一轮', () => {
    const r1 = gradeFavorite(favs, w.id, 'remember', TOMORROW);
    expect(r1.updated?.reviewLevel).toBe(1);
    expect(r1.updated?.nextReviewDate).toBe('2026-09-28');
    expect(r1.roundCompleted).toBe(false); // 句子还没评

    const r2 = gradeFavorite(r1.favorites, s.id, 'forgot', TOMORROW);
    expect(r2.updated?.reviewLevel).toBe(0);
    expect(r2.updated?.nextReviewDate).toBe('2026-09-27');
    expect(r2.roundCompleted).toBe(true);
  });

  it('同一张卡当天评过就不能再评', () => {
    const r1 = gradeFavorite(favs, w.id, 'fuzzy', TOMORROW);
    const r2 = gradeFavorite(r1.favorites, w.id, 'remember', TOMORROW);
    expect(r2.favorites).toBe(r1.favorites);
  });

  it('不存在的 id 原样返回', () => {
    expect(gradeFavorite(favs, 'nope', 'remember', TOMORROW).favorites).toBe(favs);
  });
});
