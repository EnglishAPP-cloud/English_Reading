/**
 * 内容校验（纯函数，不读文件）：scripts/content.ts 读好文件后交给这里，测试也直接调这里。
 *
 * 分两层：
 * 1. schema：字段有没有、类型对不对（zod，见 schema.ts）
 * 2. 交叉检查："对不上"的问题——词在不在段落里、下标越界、系列和文章互相引用……
 *
 * 所有问题一次全部收集起来，每条都带"哪个文件、哪个字段"。
 */
import type { z } from 'zod';

import { findWholeWord } from '@/logic/text';

import { ArticleSchema, SeriesSchema } from './schema';
import type { Article, Series } from './types';

export type ContentKind = 'article' | 'series';

export interface ContentFile {
  /** 相对项目根目录的路径，比如 content/articles/hkp-01.json（报错时显示） */
  file: string;
  kind: ContentKind;
  /** JSON.parse 之后的内容 */
  data: unknown;
}

export interface ContentIssue {
  file: string;
  /** 出问题的字段，比如 vocab[2].word；整个文件的问题写 (整个文件) */
  path: string;
  message: string;
}

export interface ValidationResult {
  issues: ContentIssue[];
  /** 通过 schema 校验的文章 / 系列（交叉检查有问题也会在这里，调用方看 issues 是否为空） */
  articles: { file: string; article: Article }[];
  series: { file: string; series: Series }[];
  /** schema 没通过的文件：这些文件还没做交叉检查，改好后重跑会继续查 */
  schemaFailed: string[];
}

type LocalIssue = { path: string; message: string };

export const WHOLE_FILE = '(整个文件)';

/** ['vocab', 2, 'word'] → 'vocab[2].word' */
export function formatPath(path: readonly PropertyKey[]): string {
  let out = '';
  for (const key of path) {
    if (typeof key === 'number') out += `[${key}]`;
    else out += out ? `.${String(key)}` : String(key);
  }
  return out || WHOLE_FILE;
}

/** 把 zod 的报错转成"字段 + 中文说明" */
function zodIssues(error: z.ZodError): LocalIssue[] {
  const out: LocalIssue[] = [];
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      // 多出来的字段：逐个列出，通常是字段名拼错了
      for (const key of issue.keys) {
        out.push({
          path: formatPath([...issue.path, key]),
          message: '不认识这个字段（是不是拼错了？允许的字段见 src/content/schema.ts）',
        });
      }
    } else if (issue.code === 'invalid_type' && issue.input === undefined) {
      out.push({ path: formatPath(issue.path), message: `缺少必填字段（应为 ${issue.expected}）` });
    } else {
      out.push({ path: formatPath(issue.path), message: issue.message });
    }
  }
  return out;
}

/** 文件名（不含 .json）应该等于 id */
function fileId(file: string): string {
  const base = file.split(/[\\/]/).pop() ?? file;
  return base.replace(/\.json$/i, '');
}

const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

/** 单篇文章内部的交叉检查 */
export function checkArticle(a: Article): LocalIssue[] {
  const out: LocalIssue[] = [];
  const push = (path: string, message: string) => out.push({ path, message });
  const paragraphs = new Map(a.paragraphs.map((p) => [p.id, p]));

  a.paragraphs.forEach((p, i) => {
    if (a.paragraphs.findIndex((q) => q.id === p.id) !== i) push(`paragraphs[${i}].id`, `段落 id "${p.id}" 重复了`);
  });

  if ((a.seriesId === undefined) !== (a.seriesIndex === undefined)) {
    push(a.seriesId === undefined ? 'seriesId' : 'seriesIndex', 'seriesId 和 seriesIndex 要么都写，要么都不写');
  }

  a.vocab.forEach((v, i) => {
    const p = paragraphs.get(v.paragraphId);
    if (!p) push(`vocab[${i}].paragraphId`, `找不到段落 "${v.paragraphId}"`);
    else if (findWholeWord(p.en, v.word) < 0) {
      push(`vocab[${i}].word`, `"${v.word}" 没有作为完整单词原样出现在段落 ${v.paragraphId} 的英文里（区分大小写）`);
    }
  });

  a.sentences.forEach((s, i) => {
    const p = paragraphs.get(s.paragraphId);
    if (!p) push(`sentences[${i}].paragraphId`, `找不到段落 "${s.paragraphId}"`);
    else if (!p.en.includes(s.text)) push(`sentences[${i}].text`, `不是段落 ${s.paragraphId} 英文的原样片段（注意标点、空格、大小写）`);
  });

  a.questions.forEach((q, i) => {
    const p = paragraphs.get(q.paragraphId);
    if (!p) push(`questions[${i}].paragraphId`, `找不到段落 "${q.paragraphId}"`);
    else if (!p.en.includes(q.answer)) push(`questions[${i}].answer`, `不是段落 ${q.paragraphId} 英文的原样片段（注意标点、空格、大小写）`);
  });

  a.check.forEach((q, i) => {
    if (q.answer >= q.options.length) {
      push(`check[${i}].answer`, `答案下标 ${q.answer} 超出范围：只有 ${q.options.length} 个选项（下标从 0 到 ${q.options.length - 1}）`);
    }
  });

  const { options, answers } = a.headings;
  for (const p of a.paragraphs) {
    if (!has(answers, p.id)) push('headings.answers', `缺少段落 "${p.id}" 的小标题答案（每一段都要有）`);
  }
  for (const [pid, idx] of Object.entries(answers)) {
    if (!paragraphs.has(pid)) push(`headings.answers.${pid}`, `文章里没有段落 "${pid}"`);
    else if (idx >= options.length) {
      push(`headings.answers.${pid}`, `下标 ${idx} 超出范围：只有 ${options.length} 个小标题（下标从 0 到 ${options.length - 1}）`);
    }
  }

  return out;
}

/** 单个系列内部的交叉检查 */
export function checkSeries(s: Series): LocalIssue[] {
  const out: LocalIssue[] = [];
  s.issues.forEach((issue, i) => {
    if (s.issues.findIndex((x) => x.index === issue.index) !== i) {
      out.push({ path: `issues[${i}].index`, message: `第 ${issue.index} 期重复了` });
    }
    if (issue.index > s.total) {
      out.push({ path: `issues[${i}].index`, message: `第 ${issue.index} 期超过了 total（共 ${s.total} 期）` });
    }
    if (issue.status === 'ready' && !issue.articleId) {
      out.push({ path: `issues[${i}].articleId`, message: 'status 为 ready 时必须写 articleId' });
    }
  });
  return out;
}

/** 校验全部内容文件 */
export function validateContent(files: readonly ContentFile[]): ValidationResult {
  const issues: ContentIssue[] = [];
  const articles: ValidationResult['articles'] = [];
  const series: ValidationResult['series'] = [];
  const schemaFailed: string[] = [];
  const add = (file: string, list: LocalIssue[]) => list.forEach((i) => issues.push({ file, ...i }));

  // 1. schema + 文件内部检查
  for (const f of files) {
    const schema = f.kind === 'article' ? ArticleSchema : SeriesSchema;
    const parsed = schema.safeParse(f.data, { reportInput: true });
    if (!parsed.success) {
      add(f.file, zodIssues(parsed.error));
      schemaFailed.push(f.file);
      continue;
    }
    const item = parsed.data;
    if (item.id !== fileId(f.file)) {
      add(f.file, [{ path: 'id', message: `id "${item.id}" 和文件名 "${fileId(f.file)}.json" 不一致` }]);
    }
    if (f.kind === 'article') {
      const article = item as Article;
      if (articles.some((x) => x.article.id === article.id)) {
        add(f.file, [{ path: 'id', message: `文章 id "${article.id}" 和别的文件重复了` }]);
      }
      add(f.file, checkArticle(article));
      articles.push({ file: f.file, article });
    } else {
      const s = item as Series;
      if (series.some((x) => x.series.id === s.id)) {
        add(f.file, [{ path: 'id', message: `系列 id "${s.id}" 和别的文件重复了` }]);
      }
      add(f.file, checkSeries(s));
      series.push({ file: f.file, series: s });
    }
  }

  // 2. 文章和系列之间的引用
  const seriesById = new Map(series.map((x) => [x.series.id, x.series]));
  const articleById = new Map(articles.map((x) => [x.article.id, x.article]));
  // schema 没通过的文件按文件名算"存在"，免得连带报一堆"找不到"
  const failedIds = (kind: ContentKind) =>
    new Set(files.filter((f) => f.kind === kind && schemaFailed.includes(f.file)).map((f) => fileId(f.file)));
  const failedArticleIds = failedIds('article');
  const failedSeriesIds = failedIds('series');

  for (const { file, article } of articles) {
    if (article.seriesId === undefined || failedSeriesIds.has(article.seriesId)) continue;
    const s = seriesById.get(article.seriesId);
    if (!s) {
      add(file, [{ path: 'seriesId', message: `找不到系列 "${article.seriesId}"（content/series 下没有这个 id）` }]);
      continue;
    }
    // 期号要和系列目录对得上，否则系列页不会链接到这篇、"已读 x 期"也不会算它
    const index = article.seriesIndex;
    if (index === undefined) continue; // 只写了 seriesId 的情况上面已经报过
    const issue = s.issues.find((x) => x.index === index);
    if (index > s.total) {
      add(file, [{ path: 'seriesIndex', message: `第 ${index} 期超过了系列 "${s.id}" 的 total（共 ${s.total} 期）` }]);
    } else if (!issue) {
      add(file, [{ path: 'seriesIndex', message: `系列 "${s.id}" 的 issues 里没有第 ${index} 期` }]);
    } else if (issue.articleId !== article.id) {
      add(file, [
        {
          path: 'seriesIndex',
          message: `系列 "${s.id}" 第 ${index} 期的 articleId 是 "${issue.articleId ?? '（没写）'}"，没有指向这篇；请在系列 JSON 里把它改成 "${article.id}"`,
        },
      ]);
    }
  }

  for (const { file, series: s } of series) {
    s.issues.forEach((issue, i) => {
      if (issue.articleId === undefined || failedArticleIds.has(issue.articleId)) return;
      const article = articleById.get(issue.articleId);
      const path = `issues[${i}].articleId`;
      if (!article) {
        add(file, [{ path, message: `找不到文章 "${issue.articleId}"（content/articles 下没有这个 id）` }]);
        return;
      }
      if (article.seriesId !== s.id) {
        add(file, [{ path, message: `文章 "${article.id}" 的 seriesId 是 "${article.seriesId ?? '（没写）'}"，不是这个系列` }]);
      } else if (article.seriesIndex !== issue.index) {
        add(file, [{ path, message: `文章 "${article.id}" 的 seriesIndex 是 ${article.seriesIndex}，和这一期的 index ${issue.index} 对不上` }]);
      }
    });
  }

  return { issues, articles, series, schemaFailed };
}

/** 把问题按文件分组，拼成给人看的报错文字 */
export function formatIssues(issues: readonly ContentIssue[]): string {
  const byFile = new Map<string, ContentIssue[]>();
  for (const i of issues) byFile.set(i.file, [...(byFile.get(i.file) ?? []), i]);
  const lines: string[] = [];
  for (const [file, list] of byFile) {
    lines.push(file);
    for (const i of list) lines.push(`  · ${i.path}：${i.message}`);
    lines.push('');
  }
  return lines.join('\n');
}
