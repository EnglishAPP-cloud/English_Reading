import { renderIndex } from '../renderIndex';

describe('renderIndex', () => {
  it('为每个 JSON 生成 import，按 id 排序，变量名合法', () => {
    const out = renderIndex(
      [
        { id: 'hkp-02', relPath: 'articles/hkp-02.json' },
        { id: 'hkp-01', relPath: 'articles/hkp-01.json' },
      ],
      [{ id: 'how-to-know-a-person', relPath: 'series/how-to-know-a-person.json' }],
    );
    expect(out).toContain("import article_hkp_01 from './articles/hkp-01.json';");
    expect(out).toContain("import series_how_to_know_a_person from './series/how-to-know-a-person.json';");
    expect(out).toContain('export const rawArticles: unknown[] = [article_hkp_01, article_hkp_02];');
    expect(out).toContain('export const rawSeries: unknown[] = [series_how_to_know_a_person];');
    expect(out.indexOf('hkp_01')).toBeLessThan(out.indexOf('hkp_02'));
  });

  it('没有内容时生成空数组', () => {
    const out = renderIndex([], []);
    expect(out).toContain('export const rawArticles: unknown[] = [];');
    expect(out).toContain('export const rawSeries: unknown[] = [];');
  });
});
