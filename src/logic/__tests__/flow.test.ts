import {
  addRawReadTime,
  articleStatus,
  articleStatusLabel,
  canCheckHeadings,
  canGoToStep,
  canSubmitCheck,
  checkHeadings,
  completeArticle,
  createProgress,
  finishRawRead,
  goToStep,
  headingResults,
  isReviewingRawRead,
  pickCheckAnswer,
  pickHeading,
  rawReadRemaining,
  recommendMode,
  resetHeadings,
  revealQuestion,
  scoreCheck,
  setOutputText,
  startPractice,
  startRawRead,
  submitCheck,
  switchMode,
  toggleFeedback,
  type ArticleProgress,
} from '@/logic/flow';

const NOW = '2026-09-25T10:00:00.000Z';
const LATER = '2026-09-25T10:20:00.000Z';
// 和 hkp-01 一样：两道题，正确答案是 2 和 0
const QUESTIONS = [{ answer: 2 }, { answer: 0 }];
const PARAS = ['p1', 'p2', 'p3'];
const HEADINGS = { answers: { p1: 1, p2: 4, p3: 6 } };

/** 走到检测步骤 */
function atCheck(): ArticleProgress {
  let p = startRawRead(createProgress(), NOW);
  p = addRawReadTime(p, 100);
  return finishRawRead(p);
}

/** 按给定答案提交检测 */
function submitted(picks: [number, number]): ArticleProgress {
  let p = atCheck();
  p = pickCheckAnswer(p, 0, picks[0], 2);
  p = pickCheckAnswer(p, 1, picks[1], 2);
  return submitCheck(p, QUESTIONS);
}

describe('分流 recommendMode', () => {
  it('2 道题：2 对挑战、1 对读准、0 对精读补上', () => {
    expect(recommendMode(2, 2)).toBe('challenge');
    expect(recommendMode(1, 2)).toBe('accurate');
    expect(recommendMode(0, 2)).toBe('deep');
  });

  it('按得分率：全对挑战，≥ 一半读准，否则精读补上', () => {
    expect(recommendMode(3, 3)).toBe('challenge');
    expect(recommendMode(2, 3)).toBe('accurate');
    expect(recommendMode(1, 3)).toBe('deep');
    expect(recommendMode(2, 4)).toBe('accurate');
    expect(recommendMode(1, 4)).toBe('deep');
    expect(recommendMode(1, 1)).toBe('challenge');
    expect(recommendMode(0, 1)).toBe('deep');
  });

  it('没有题目时按精读补上', () => {
    expect(recommendMode(0, 0)).toBe('deep');
  });

  it('scoreCheck 数答对几道', () => {
    expect(scoreCheck(QUESTIONS, [2, 0])).toBe(2);
    expect(scoreCheck(QUESTIONS, [2, 1])).toBe(1);
    expect(scoreCheck(QUESTIONS, [null, null])).toBe(0);
  });
});

describe('定向 → 裸读', () => {
  it('新进度停在定向，状态是未读', () => {
    const p = createProgress();
    expect(p.step).toBe('orient');
    expect(articleStatus(p)).toEqual({ kind: 'unread' });
    expect(articleStatus(undefined)).toEqual({ kind: 'unread' });
  });

  it('开始裸读：进入裸读，记下开始时间', () => {
    const p = startRawRead(createProgress(), NOW);
    expect(p.step).toBe('raw');
    expect(p.reachedStep).toBe('raw');
    expect(p.startedAt).toBe(NOW);
    expect(articleStatusLabel(articleStatus(p))).toBe('读到第 2 步 · 裸读');
  });

  it('只累计裸读进行中的时间，负数和其他步骤不算', () => {
    let p = startRawRead(createProgress(), NOW);
    p = addRawReadTime(p, 30);
    p = addRawReadTime(p, 12.5);
    p = addRawReadTime(p, -5);
    expect(p.rawElapsedSec).toBe(42.5);
    expect(addRawReadTime(createProgress(), 10).rawElapsedSec).toBe(0);
  });

  it('剩余时间可以变成负数（超时只提示，不强制跳转）', () => {
    let p = startRawRead(createProgress(), NOW);
    p = addRawReadTime(p, 250);
    expect(p.step).toBe('raw');
    expect(rawReadRemaining(p, 240)).toBe(-10);
  });

  it('读完了：记下用时（四舍五入到秒），进入检测，之后不再计时', () => {
    let p = startRawRead(createProgress(), NOW);
    p = addRawReadTime(p, 95.6);
    p = finishRawRead(p);
    expect(p.step).toBe('check');
    expect(p.rawUsedSec).toBe(96);
    expect(addRawReadTime(p, 10)).toBe(p);
    expect(finishRawRead(p)).toBe(p);
  });
});

describe('检测', () => {
  it('全部答完才能提交', () => {
    let p = atCheck();
    expect(canSubmitCheck(p, 2)).toBe(false);
    p = pickCheckAnswer(p, 0, 2, 2);
    expect(canSubmitCheck(p, 2)).toBe(false);
    expect(submitCheck(p, QUESTIONS)).toBe(p);
    p = pickCheckAnswer(p, 1, 3, 2);
    expect(canSubmitCheck(p, 2)).toBe(true);
  });

  it('答题前可以改选', () => {
    let p = atCheck();
    p = pickCheckAnswer(p, 0, 1, 2);
    p = pickCheckAnswer(p, 0, 2, 2);
    expect(p.checkPicks).toEqual([2, null]);
  });

  it('题号越界、不在检测步骤时选择无效', () => {
    const p = atCheck();
    expect(pickCheckAnswer(p, 5, 0, 2)).toBe(p);
    const orient = createProgress();
    expect(pickCheckAnswer(orient, 0, 0, 2)).toBe(orient);
  });

  it.each([
    [[2, 0], 2, 'challenge'],
    [[2, 1], 1, 'accurate'],
    [[1, 0], 1, 'accurate'],
    [[0, 1], 0, 'deep'],
  ] as const)('答案 %j → 答对 %i 道 → %s', (picks, correct, mode) => {
    const p = submitted([picks[0], picks[1]]);
    expect(p.checkResult).toEqual({ correct, total: 2, recommended: mode });
    expect(p.mode).toBe(mode);
  });

  it('提交后不能改答案、不能再提交', () => {
    const p = submitted([0, 1]);
    expect(pickCheckAnswer(p, 0, 2, 2)).toBe(p);
    expect(canSubmitCheck(p, 2)).toBe(false);
    expect(submitCheck(p, QUESTIONS)).toBe(p);
  });
});

describe('练习', () => {
  it('提交后才能开始练习，进入推荐练法', () => {
    expect(startPractice(atCheck()).step).toBe('check');
    const p = startPractice(submitted([2, 1]));
    expect(p.step).toBe('practice');
    expect(p.mode).toBe('accurate');
    expect(articleStatusLabel(articleStatus(p))).toBe('读到第 4 步 · 练习');
  });

  it('三种练法可以互相切换', () => {
    let p = startPractice(submitted([0, 1]));
    expect(p.mode).toBe('deep');
    p = switchMode(p, 'accurate');
    expect(p.mode).toBe('accurate');
    p = switchMode(p, 'challenge');
    expect(p.mode).toBe('challenge');
    p = switchMode(p, 'deep');
    expect(p.mode).toBe('deep');
    // 推荐练法不变
    expect(p.checkResult?.recommended).toBe('deep');
  });

  it('不在练习步骤时不能切换练法', () => {
    const p = submitted([0, 1]);
    expect(switchMode(p, 'challenge')).toBe(p);
  });

  it('读准：标出答案会记住，重复点不重复记', () => {
    let p = startPractice(submitted([2, 1]));
    p = revealQuestion(p, 2);
    p = revealQuestion(p, 0);
    p = revealQuestion(p, 2);
    expect(p.revealedQuestions).toEqual([0, 2]);
  });

  describe('挑战：小标题', () => {
    it('全部选完才能检查', () => {
      let p = startPractice(submitted([2, 0]));
      p = pickHeading(p, 'p1', 1);
      p = pickHeading(p, 'p2', 3);
      expect(canCheckHeadings(p, PARAS)).toBe(false);
      expect(checkHeadings(p, PARAS)).toBe(p);
      p = pickHeading(p, 'p3', 6);
      expect(canCheckHeadings(p, PARAS)).toBe(true);
      p = checkHeadings(p, PARAS);
      expect(p.headingsChecked).toBe(true);
      expect(headingResults(p, HEADINGS, PARAS)).toEqual({
        correct: 2,
        total: 3,
        byParagraph: { p1: true, p2: false, p3: true },
      });
    });

    it('检查后不能改，"重新选"会清空', () => {
      let p = startPractice(submitted([2, 0]));
      for (const id of PARAS) p = pickHeading(p, id, 0);
      p = checkHeadings(p, PARAS);
      expect(pickHeading(p, 'p1', 1)).toBe(p);
      p = resetHeadings(p);
      expect(p.headingPicks).toEqual({});
      expect(p.headingsChecked).toBe(false);
    });

    it('选 null 表示清空这一段', () => {
      let p = pickHeading(createProgress(), 'p1', 2);
      p = pickHeading(p, 'p1', null);
      expect(p.headingPicks).toEqual({});
    });
  });

  it('一句话输出、读后反馈', () => {
    let p = setOutputText(createProgress(), 'My teacher.');
    expect(p.outputText).toBe('My teacher.');
    p = toggleFeedback(p, '有点难');
    p = toggleFeedback(p, '时间刚好');
    p = toggleFeedback(p, '有点难');
    expect(p.feedback).toEqual(['时间刚好']);
  });

  it('读完了：记录完成时间，只记第一次；只能在练习步骤完成', () => {
    expect(completeArticle(submitted([2, 0]), NOW).completedAt).toBeUndefined();
    let p = startPractice(submitted([2, 0]));
    p = completeArticle(p, NOW);
    expect(p.completedAt).toBe(NOW);
    expect(completeArticle(p, LATER).completedAt).toBe(NOW);
    expect(articleStatus(p)).toEqual({ kind: 'completed', completedAt: NOW });
    expect(articleStatusLabel(articleStatus(p))).toBe('已完成');
  });
});

describe('回看', () => {
  it('检测提交前只能往前走，不能回裸读或定向', () => {
    const p = atCheck();
    expect(canGoToStep(p, 'raw')).toBe(false);
    expect(canGoToStep(p, 'orient')).toBe(false);
    expect(goToStep(p, 'raw')).toBe(p);
    const raw = startRawRead(createProgress(), NOW);
    expect(canGoToStep(raw, 'orient')).toBe(false);
  });

  it('提交后可以回看到过的步骤，但不能跳到没到过的', () => {
    const p = submitted([2, 0]); // 到过检测，还没开始练习
    expect(canGoToStep(p, 'raw')).toBe(true);
    expect(canGoToStep(p, 'orient')).toBe(true);
    expect(canGoToStep(p, 'practice')).toBe(false);
    const practice = startPractice(p);
    expect(goToStep(practice, 'raw').step).toBe('raw');
  });

  it('回看裸读时不计时、不改用时，步骤状态仍按最远一步显示', () => {
    let p = goToStep(startPractice(submitted([2, 0])), 'raw');
    expect(isReviewingRawRead(p)).toBe(true);
    const used = p.rawUsedSec;
    p = addRawReadTime(p, 50);
    expect(p.rawUsedSec).toBe(used);
    expect(p.rawElapsedSec).toBe(100);
    expect(finishRawRead(p)).toBe(p);
    expect(articleStatusLabel(articleStatus(p))).toBe('读到第 4 步 · 练习');
    // 回到练习
    expect(goToStep(p, 'practice').step).toBe('practice');
  });

  it('开始裸读只在第一次有效', () => {
    const p = goToStep(startPractice(submitted([2, 0])), 'orient');
    expect(startRawRead(p, LATER)).toBe(p);
  });
});

describe('进度能存能恢复', () => {
  it('进度是纯 JSON，存进去再读出来一模一样', () => {
    let p = startPractice(submitted([2, 1]));
    p = revealQuestion(p, 1);
    p = pickHeading(p, 'p1', 3);
    p = setOutputText(p, 'x');
    expect(JSON.parse(JSON.stringify(p))).toEqual(p);
  });
});
