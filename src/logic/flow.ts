/**
 * 单篇文章的学习流程：定向 → 裸读 → 检测 → 练习。
 *
 * 这里的函数都是"纯函数"：输入旧进度，返回新进度，不改原对象、不读时钟、不读存储。
 * 不允许的操作（比如检测提交后再改答案）直接原样返回旧进度，页面不用自己判断。
 */
import type { CheckQuestion, Headings } from '@/content/types';

// ———————————————————— 步骤与练法 ————————————————————

export const STEPS = ['orient', 'raw', 'check', 'practice'] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_LABELS: Record<StepId, string> = {
  orient: '定向',
  raw: '裸读',
  check: '检测',
  practice: '练习',
};

export const PRACTICE_MODES = ['deep', 'accurate', 'challenge'] as const;
export type PracticeMode = (typeof PRACTICE_MODES)[number];

export const MODE_LABELS: Record<PracticeMode, string> = {
  deep: '精读补上',
  accurate: '读准',
  challenge: '挑战',
};

/** 读后反馈可选的标签（多选） */
export const FEEDBACK_TAGS = ['时间刚好', '有点长', '有点难', '想看下一期'] as const;

// ———————————————————— 进度数据 ————————————————————

export interface CheckResult {
  correct: number; // 答对几道
  total: number; // 一共几道
  recommended: PracticeMode; // 按得分推荐的练法
}

/** 一篇文章的学习进度（会存到手机本地） */
export interface ArticleProgress {
  step: StepId; // 当前在哪一步
  reachedStep: StepId; // 到过的最远一步（步骤条、知识库状态用）
  rawElapsedSec: number; // 裸读已累计的秒数（只算停在裸读页、APP 在前台的时间）
  rawUsedSec?: number; // 点"读完了"时记下的裸读用时；有值 = 裸读已结束
  checkPicks: (number | null)[]; // 每道检测题选了第几个选项
  checkResult?: CheckResult; // 提交检测后才有；有值 = 已提交，不能再改
  mode?: PracticeMode; // 当前练法
  headingPicks: Record<string, number>; // 挑战：段落 id → 选的小标题下标
  headingsChecked: boolean; // 挑战：是否已点"检查"
  revealedQuestions: number[]; // 读准：已经标出答案的题号
  outputText: string; // 一句话输出
  feedback: string[]; // 读后反馈标签
  startedAt?: string; // 点"开始裸读"的时间（ISO）
  completedAt?: string; // 点"读完了"的时间（ISO）；有值 = 本篇已完成
}

/** 新进度：停在定向 */
export function createProgress(): ArticleProgress {
  return {
    step: 'orient',
    reachedStep: 'orient',
    rawElapsedSec: 0,
    checkPicks: [],
    headingPicks: {},
    headingsChecked: false,
    revealedQuestions: [],
    outputText: '',
    feedback: [],
  };
}

export const stepIndex = (step: StepId): number => STEPS.indexOf(step);

/** 走到某一步，并更新"到过的最远一步" */
function moveTo(p: ArticleProgress, step: StepId): ArticleProgress {
  const reachedStep = stepIndex(step) > stepIndex(p.reachedStep) ? step : p.reachedStep;
  return { ...p, step, reachedStep };
}

// ———————————————————— 分流 ————————————————————

/**
 * 按检测得分推荐练法。得分率 = 答对数 / 题数：
 * 全对 → 挑战；答对一半及以上 → 读准；否则 → 精读补上。
 * 例：2 道题时，2 对挑战、1 对读准、0 对精读补上。
 */
export function recommendMode(correct: number, total: number): PracticeMode {
  if (total <= 0) return 'deep'; // 没有题（内容校验会拦住），按最基础的练法来
  if (correct >= total) return 'challenge';
  if (correct * 2 >= total) return 'accurate';
  return 'deep';
}

/** 算检测答对几道 */
export function scoreCheck(questions: readonly Pick<CheckQuestion, 'answer'>[], picks: readonly (number | null)[]): number {
  return questions.filter((q, i) => picks[i] === q.answer).length;
}

// ———————————————————— 定向、裸读 ————————————————————

/** 定向页点"开始裸读"：只有还没开始过时有效 */
export function startRawRead(p: ArticleProgress, nowIso: string): ArticleProgress {
  if (p.reachedStep !== 'orient') return p;
  return { ...moveTo(p, 'raw'), startedAt: p.startedAt ?? nowIso };
}

/** 裸读计时：累计秒数。只在裸读进行中（还没点"读完了"）有效 */
export function addRawReadTime(p: ArticleProgress, seconds: number): ArticleProgress {
  if (p.step !== 'raw' || p.rawUsedSec !== undefined || !(seconds > 0)) return p;
  return { ...p, rawElapsedSec: p.rawElapsedSec + seconds };
}

/** 裸读还剩几秒（负数 = 已超时多少秒）。时间到了只提示，不强制跳转 */
export function rawReadRemaining(p: ArticleProgress, rawReadSeconds: number): number {
  return rawReadSeconds - (p.rawUsedSec ?? p.rawElapsedSec);
}

/** 裸读页点"读完了"：记下用时，进入检测 */
export function finishRawRead(p: ArticleProgress): ArticleProgress {
  if (p.step !== 'raw' || p.rawUsedSec !== undefined) return p;
  return { ...moveTo(p, 'check'), rawUsedSec: Math.round(p.rawElapsedSec) };
}

// ———————————————————— 检测 ————————————————————

/** 选某道题的某个选项。提交后不能改 */
export function pickCheckAnswer(
  p: ArticleProgress,
  questionIndex: number,
  optionIndex: number,
  questionCount: number,
): ArticleProgress {
  if (p.step !== 'check' || p.checkResult) return p;
  if (questionIndex < 0 || questionIndex >= questionCount) return p;
  const picks = Array.from({ length: questionCount }, (_, i) => p.checkPicks[i] ?? null);
  picks[questionIndex] = optionIndex;
  return { ...p, checkPicks: picks };
}

/** 全部答完、还没提交，才能提交 */
export function canSubmitCheck(p: ArticleProgress, questionCount: number): boolean {
  if (p.checkResult || questionCount <= 0) return false;
  return Array.from({ length: questionCount }, (_, i) => p.checkPicks[i]).every((x) => x !== null && x !== undefined);
}

/** 提交检测：判分、分流，当前练法设为推荐练法 */
export function submitCheck(p: ArticleProgress, questions: readonly Pick<CheckQuestion, 'answer'>[]): ArticleProgress {
  if (!canSubmitCheck(p, questions.length)) return p;
  const correct = scoreCheck(questions, p.checkPicks);
  const recommended = recommendMode(correct, questions.length);
  return { ...p, checkResult: { correct, total: questions.length, recommended }, mode: recommended };
}

// ———————————————————— 练习 ————————————————————

/** 检测结果页点"开始练习" */
export function startPractice(p: ArticleProgress): ArticleProgress {
  if (!p.checkResult) return p;
  return { ...moveTo(p, 'practice'), mode: p.mode ?? p.checkResult.recommended };
}

/** 切换练法（练习步骤里随时可以换） */
export function switchMode(p: ArticleProgress, mode: PracticeMode): ArticleProgress {
  if (!p.checkResult || p.step !== 'practice' || p.mode === mode) return p;
  return { ...p, mode };
}

/** 读准：标出第 i 题的答案 */
export function revealQuestion(p: ArticleProgress, index: number): ArticleProgress {
  if (p.revealedQuestions.includes(index)) return p;
  return { ...p, revealedQuestions: [...p.revealedQuestions, index].sort((a, b) => a - b) };
}

/** 挑战：给某段选小标题（null = 清空）。检查过后要先"重新选"才能改 */
export function pickHeading(p: ArticleProgress, paragraphId: string, optionIndex: number | null): ArticleProgress {
  if (p.headingsChecked) return p;
  const headingPicks = { ...p.headingPicks };
  if (optionIndex === null) delete headingPicks[paragraphId];
  else headingPicks[paragraphId] = optionIndex;
  return { ...p, headingPicks };
}

/** 挑战：每段都选了才能检查 */
export function canCheckHeadings(p: ArticleProgress, paragraphIds: readonly string[]): boolean {
  return !p.headingsChecked && paragraphIds.length > 0 && paragraphIds.every((id) => p.headingPicks[id] !== undefined);
}

export function checkHeadings(p: ArticleProgress, paragraphIds: readonly string[]): ArticleProgress {
  return canCheckHeadings(p, paragraphIds) ? { ...p, headingsChecked: true } : p;
}

/** 挑战：重新选（清空选择和检查结果）。本来就是空的就原样返回 */
export function resetHeadings(p: ArticleProgress): ArticleProgress {
  if (!p.headingsChecked && Object.keys(p.headingPicks).length === 0) return p;
  return { ...p, headingPicks: {}, headingsChecked: false };
}

/** 挑战：每段对错和总分 */
export function headingResults(
  p: ArticleProgress,
  headings: Pick<Headings, 'answers'>,
  paragraphIds: readonly string[],
): { correct: number; total: number; byParagraph: Record<string, boolean> } {
  const byParagraph: Record<string, boolean> = {};
  for (const id of paragraphIds) byParagraph[id] = p.headingPicks[id] !== undefined && p.headingPicks[id] === headings.answers[id];
  return { correct: Object.values(byParagraph).filter(Boolean).length, total: paragraphIds.length, byParagraph };
}

/** 一句话输出 */
export function setOutputText(p: ArticleProgress, text: string): ArticleProgress {
  return p.outputText === text ? p : { ...p, outputText: text };
}

/** 读后反馈：点一下选中，再点取消 */
export function toggleFeedback(p: ArticleProgress, tag: string): ArticleProgress {
  const feedback = p.feedback.includes(tag) ? p.feedback.filter((t) => t !== tag) : [...p.feedback, tag];
  return { ...p, feedback };
}

/** 练习页点"读完了"：本篇完成（只记第一次完成的时间） */
export function completeArticle(p: ArticleProgress, nowIso: string): ArticleProgress {
  if (p.step !== 'practice' || p.completedAt) return p;
  return { ...p, completedAt: nowIso };
}

// ———————————————————— 回看 ————————————————————

/**
 * 能不能通过步骤条跳到某一步：
 * - 检测提交前只能往前走（不能回裸读翻原文答题）
 * - 提交后，到过的步骤都能回看
 */
export function canGoToStep(p: ArticleProgress, step: StepId): boolean {
  if (step === p.step) return true;
  if (!p.checkResult) return false;
  return stepIndex(step) <= stepIndex(p.reachedStep);
}

export function goToStep(p: ArticleProgress, step: StepId): ArticleProgress {
  return canGoToStep(p, step) && step !== p.step ? { ...p, step } : p;
}

/**
 * 重新打开一篇文章时的进度：已完成的文章统一停在练习步骤
 * （回看过定向 / 裸读后离开，再进来也回到练习）；没完成的保持离开时的步骤。
 */
export function progressOnOpen(p: ArticleProgress): ArticleProgress {
  return p.completedAt && p.step !== 'practice' ? { ...p, step: 'practice' } : p;
}

/** 当前是在"回看"裸读（裸读已结束，不再计时） */
export function isReviewingRawRead(p: ArticleProgress): boolean {
  return p.step === 'raw' && p.rawUsedSec !== undefined;
}

// ———————————————————— 状态（知识库、今日页显示） ————————————————————

export type ArticleStatus =
  | { kind: 'unread' }
  | { kind: 'reading'; step: StepId; stepNumber: number }
  | { kind: 'completed'; completedAt: string };

/** 未读 / 读到第几步 / 已完成。"读到第几步"按到过的最远一步算 */
export function articleStatus(p: ArticleProgress | undefined): ArticleStatus {
  if (!p) return { kind: 'unread' };
  if (p.completedAt) return { kind: 'completed', completedAt: p.completedAt };
  if (p.reachedStep === 'orient' && !p.startedAt) return { kind: 'unread' };
  return { kind: 'reading', step: p.reachedStep, stepNumber: stepIndex(p.reachedStep) + 1 };
}

export function articleStatusLabel(status: ArticleStatus): string {
  switch (status.kind) {
    case 'unread':
      return '未读';
    case 'completed':
      return '已完成';
    case 'reading':
      return `读到第 ${status.stepNumber} 步 · ${STEP_LABELS[status.step]}`;
  }
}
