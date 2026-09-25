import { formatIssues, formatPath, validateContent, type ContentFile } from '../validate';

import { ARTICLE_FILE, SERIES_FILE, sampleArticle, sampleSeries } from './fixtures';

/** 把改过的文章 / 系列组装成一次校验 */
function run(article: unknown = sampleArticle(), series: unknown = sampleSeries(), extra: ContentFile[] = []) {
  return validateContent([
    { file: ARTICLE_FILE, kind: 'article', data: article },
    { file: SERIES_FILE, kind: 'series', data: series },
    ...extra,
  ]);
}

/** 只看"字段: 说明"，方便断言 */
const paths = (r: ReturnType<typeof run>) => r.issues.map((i) => `${i.file} ${i.path}`);

describe('内容校验', () => {
  it('仓库里的样例内容全部通过', () => {
    const r = run();
    expect(r.issues).toEqual([]);
    expect(r.articles).toHaveLength(1);
    expect(r.series).toHaveLength(1);
  });

  describe('schema', () => {
    it('缺字段、拼错字段名都能指出具体字段', () => {
      const a = sampleArticle() as Record<string, unknown>;
      a.titleEm = a.titleEn;
      delete a.titleEn;
      const r = run(a);
      expect(paths(r)).toEqual(
        expect.arrayContaining([`${ARTICLE_FILE} titleEn`, `${ARTICLE_FILE} titleEm`]),
      );
      expect(r.issues.find((i) => i.path === 'titleEn')?.message).toContain('缺少必填字段');
      expect(r.schemaFailed).toEqual([ARTICLE_FILE]);
      // 系列那边不会连带报"找不到文章 hkp-01"
      expect(r.issues.every((i) => i.file === ARTICLE_FILE)).toBe(true);
    });

    it('嵌套字段的路径写成 vocab[1].phonetic 的形式', () => {
      const a = sampleArticle() as unknown as { vocab: Record<string, unknown>[] };
      a.vocab[1]!.phonetic = 123;
      expect(paths(run(a))).toContain(`${ARTICLE_FILE} vocab[1].phonetic`);
    });

    it('栏目、难度只能取规定的值', () => {
      const a = sampleArticle() as unknown as Record<string, unknown>;
      a.column = 'culture';
      a.level = 'ielts';
      expect(paths(run(a))).toEqual([`${ARTICLE_FILE} column`, `${ARTICLE_FILE} level`]);
    });

    it('publishAt 必须是存在的 YYYY-MM-DD', () => {
      const a = sampleArticle();
      a.publishAt = '2026-02-30';
      expect(paths(run(a))).toEqual([`${ARTICLE_FILE} publishAt`]);
      a.publishAt = '2026/09/25';
      expect(paths(run(a))).toEqual([`${ARTICLE_FILE} publishAt`]);
    });

    it('intro 可以不写', () => {
      const a = sampleArticle();
      delete a.intro;
      expect(run(a).issues).toEqual([]);
    });

    it('id 必须和文件名一致', () => {
      const a = sampleArticle();
      a.id = 'hkp-99';
      a.seriesId = undefined;
      a.seriesIndex = undefined;
      const s = sampleSeries();
      s.issues[0]!.articleId = undefined;
      s.issues[0]!.status = 'soon';
      expect(paths(run(a, s))).toEqual([`${ARTICLE_FILE} id`]);
    });
  });

  describe('文章里"对不上"的地方', () => {
    it('vocab.word 必须作为完整单词原样出现在对应段落', () => {
      const a = sampleArticle();
      a.vocab[0]!.word = 'registe'; // 只是单词的一部分
      a.vocab[1]!.word = 'illuminators'; // 大小写不对
      a.vocab[2]!.paragraphId = 'p1'; // 段落不对
      expect(paths(run(a))).toEqual([
        `${ARTICLE_FILE} vocab[0].word`,
        `${ARTICLE_FILE} vocab[1].word`,
        `${ARTICLE_FILE} vocab[2].word`,
      ]);
    });

    it('vocab.paragraphId 必须存在', () => {
      const a = sampleArticle();
      a.vocab[0]!.paragraphId = 'p99';
      expect(paths(run(a))).toEqual([`${ARTICLE_FILE} vocab[0].paragraphId`]);
    });

    it('sentences.text、questions.answer 必须是对应段落的原样子串', () => {
      const a = sampleArticle();
      a.sentences[0]!.text = a.sentences[0]!.text.replace('Worse,', 'Worse');
      a.questions[2]!.paragraphId = 'p5';
      expect(paths(run(a))).toEqual([`${ARTICLE_FILE} sentences[0].text`, `${ARTICLE_FILE} questions[2].answer`]);
    });

    it('check.answer 必须在选项范围内', () => {
      const a = sampleArticle();
      a.check[1]!.answer = 4;
      const r = run(a);
      expect(paths(r)).toEqual([`${ARTICLE_FILE} check[1].answer`]);
      expect(r.issues[0]!.message).toContain('只有 4 个选项');
    });

    it('headings.answers 要覆盖每一段、段落要存在、下标在范围内', () => {
      const a = sampleArticle();
      delete a.headings.answers.p6;
      a.headings.answers.p9 = 0;
      a.headings.answers.p1 = 8;
      expect(paths(run(a))).toEqual([
        `${ARTICLE_FILE} headings.answers`,
        `${ARTICLE_FILE} headings.answers.p1`,
        `${ARTICLE_FILE} headings.answers.p9`,
      ]);
    });

    it('段落 id 不能重复', () => {
      const a = sampleArticle();
      a.paragraphs[1]!.id = 'p1';
      expect(paths(run(a))).toContain(`${ARTICLE_FILE} paragraphs[1].id`);
    });

    it('seriesId 和 seriesIndex 要么都写要么都不写', () => {
      const a = sampleArticle();
      a.seriesIndex = undefined;
      expect(paths(run(a))).toContain(`${ARTICLE_FILE} seriesIndex`);
    });
  });

  describe('文章和系列之间的引用', () => {
    it('文章的 seriesId 必须存在', () => {
      const a = sampleArticle();
      a.seriesId = 'no-such-series';
      expect(paths(run(a))).toEqual(
        expect.arrayContaining([`${ARTICLE_FILE} seriesId`, `${SERIES_FILE} issues[0].articleId`]),
      );
    });

    it('系列 issues 里写了的 articleId 必须存在', () => {
      const s = sampleSeries();
      s.issues[1]!.articleId = 'hkp-02';
      expect(paths(run(undefined, s))).toEqual([`${SERIES_FILE} issues[1].articleId`]);
    });

    it('status 为 ready 时必须写 articleId', () => {
      const s = sampleSeries();
      s.issues[1]!.status = 'ready';
      expect(paths(run(undefined, s))).toEqual([`${SERIES_FILE} issues[1].articleId`]);
    });

    it('引用的文章期号要和 index 对上（只在系列那边报一次）', () => {
      const a = sampleArticle();
      a.seriesIndex = 2;
      expect(paths(run(a))).toEqual([`${SERIES_FILE} issues[0].articleId`]);
    });

    it('新文章写了期号，但系列目录那一期忘了写 articleId', () => {
      const a2 = { ...sampleArticle(), id: 'hkp-02', seriesIndex: 2 };
      const r = run(undefined, undefined, [{ file: 'content/articles/hkp-02.json', kind: 'article', data: a2 }]);
      expect(paths(r)).toEqual(['content/articles/hkp-02.json seriesIndex']);
      expect(r.issues[0]!.message).toContain('请把第 2 期的 articleId 写成 "hkp-02"');
    });

    it('文章期号超过系列 total、或系列里没有这一期', () => {
      const a = sampleArticle();
      a.seriesIndex = 9;
      expect(paths(run(a))).toContain(`${ARTICLE_FILE} seriesIndex`);
      const s = sampleSeries();
      s.issues = s.issues.filter((x) => x.index !== 3);
      const a3 = { ...sampleArticle(), id: 'hkp-03', seriesIndex: 3 };
      const r = run(undefined, s, [{ file: 'content/articles/hkp-03.json', kind: 'article', data: a3 }]);
      expect(r.issues.find((i) => i.file === 'content/articles/hkp-03.json')?.message).toContain('没有第 3 期');
    });

    it('期号不能重复、不能超过 total', () => {
      const s = sampleSeries();
      s.issues[2]!.index = 2;
      s.issues[4]!.index = 6;
      expect(paths(run(undefined, s))).toEqual([`${SERIES_FILE} issues[2].index`, `${SERIES_FILE} issues[4].index`]);
    });

    it('两个文件用了同一个 id 会报错', () => {
      const r = run(undefined, undefined, [
        { file: 'content/articles/hkp-01.json', kind: 'article', data: sampleArticle() },
      ]);
      expect(r.issues.some((i) => i.path === 'id' && i.message.includes('重复'))).toBe(true);
    });
  });

  it('formatPath / formatIssues 输出给人看的格式', () => {
    expect(formatPath(['vocab', 2, 'word'])).toBe('vocab[2].word');
    expect(formatPath([])).toBe('(整个文件)');
    const text = formatIssues([
      { file: 'a.json', path: 'x', message: '错1' },
      { file: 'a.json', path: 'y[0]', message: '错2' },
    ]);
    expect(text).toContain('a.json\n  · x：错1\n  · y[0]：错2');
  });
});
