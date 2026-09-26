import { sampleArticle } from '@/content/__tests__/fixtures';
import { markOf, paragraphMarks, segmentText, type Mark } from '@/logic/annotate';

const article = sampleArticle();
const para = (id: string) => article.paragraphs.find((p) => p.id === id)!;

describe('段落标记', () => {
  it('重点词：每个词标出第一次出现的位置', () => {
    const marks = paragraphMarks(article, para('p2'), { vocab: true });
    const words = marks.map((m) => para('p2').en.slice(m.start, m.end));
    expect(words).toEqual(['register', 'Illuminators', 'Diminishers']);
    expect(marks.every((m) => m.kind === 'vocab')).toBe(true);
  });

  it('长难句和读准答案', () => {
    const p4 = paragraphMarks(article, para('p4'), { sentences: true });
    expect(p4).toHaveLength(1);
    expect(para('p4').en.slice(p4[0]!.start, p4[0]!.end)).toBe(article.sentences[0]!.text);

    const p5 = paragraphMarks(article, para('p5'), { answers: true });
    expect(p5.map((m) => m.ref)).toEqual([1]);
  });

  it('什么都不标时没有标记（裸读、挑战）', () => {
    expect(paragraphMarks(article, para('p2'), {})).toEqual([]);
  });

  it('切片：拼起来还是原文，每片带上覆盖它的标记', () => {
    const text = 'Recognition is a basic human need. When someone notices.';
    const marks: Mark[] = [
      { kind: 'sentence', ref: 0, start: 0, end: 34 },
      { kind: 'vocab', ref: 5, start: 0, end: 11 },
    ];
    const segs = segmentText(text, marks);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    expect(segs.map((s) => s.text)).toEqual(['Recognition', ' is a basic human need.', ' When someone notices.']);
    expect(markOf(segs[0]!, 'vocab')?.ref).toBe(5);
    expect(markOf(segs[0]!, 'sentence')?.ref).toBe(0);
    expect(markOf(segs[1]!, 'vocab')).toBeUndefined();
    expect(segs[2]!.marks).toEqual([]);
  });

  it('没有标记时整段一片', () => {
    expect(segmentText('abc', [])).toEqual([{ text: 'abc', marks: [] }]);
  });

  it('p5 同时标长难句和词：Recognition 不在长难句里，strength 句是长难句', () => {
    const p = para('p5');
    const segs = segmentText(p.en, paragraphMarks(article, p, { vocab: true, sentences: true }));
    expect(segs.map((s) => s.text).join('')).toBe(p.en);
    const rec = segs.find((s) => s.text === 'Recognition')!;
    expect(markOf(rec, 'vocab')).toBeDefined();
    expect(markOf(rec, 'sentence')).toBeUndefined();
    expect(segs.some((s) => markOf(s, 'sentence') && s.text.includes('grow into it'))).toBe(true);
  });
});
