/**
 * 生成 content/index.ts 的文件内容。
 * Metro（打包工具）不能在运行时扫描文件夹，所以要把每个 JSON 显式 import 一遍。
 */

/** 'hkp-01' → 'hkp_01'，变成合法的变量名 */
function toIdentifier(prefix: string, id: string): string {
  return `${prefix}_${id.replace(/[^A-Za-z0-9]/g, '_')}`;
}

export interface IndexEntry {
  /** 内容 id（等于文件名） */
  id: string;
  /** 相对 content/ 目录的路径，比如 articles/hkp-01.json */
  relPath: string;
}

export function renderIndex(articles: readonly IndexEntry[], series: readonly IndexEntry[]): string {
  const byId = (a: IndexEntry, b: IndexEntry) => a.id.localeCompare(b.id);
  const a = [...articles].sort(byId).map((e) => ({ ...e, name: toIdentifier('article', e.id) }));
  const s = [...series].sort(byId).map((e) => ({ ...e, name: toIdentifier('series', e.id) }));
  const lines = [
    '// ⚠️ 此文件由 scripts/content.ts 自动生成，不要手改。',
    '// 在 content/articles 或 content/series 里增删改 JSON 后，运行 npm run content 重新生成。',
    '',
    ...a.map((e) => `import ${e.name} from './${e.relPath}';`),
    ...s.map((e) => `import ${e.name} from './${e.relPath}';`),
    '',
    '/** 全部文章的原始 JSON（由 LocalContentRepository 用 zod 解析） */',
    `export const rawArticles: unknown[] = [${a.map((e) => e.name).join(', ')}];`,
    '',
    '/** 全部系列的原始 JSON */',
    `export const rawSeries: unknown[] = [${s.map((e) => e.name).join(', ')}];`,
    '',
  ];
  return lines.join('\n');
}
