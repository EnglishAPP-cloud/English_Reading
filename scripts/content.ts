/**
 * 内容脚本：npm run content（npm start 之前会自动运行）
 *
 * 1. 扫描 content/articles/*.json 和 content/series/*.json
 * 2. 校验：schema + "对不上"的交叉检查（规则在 src/content/validate.ts）
 * 3. 全部通过才生成 content/index.ts；有问题就列出"哪个文件、哪个字段"，并以失败退出
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { formatIssues, validateContent, WHOLE_FILE, type ContentFile, type ContentIssue } from '../src/content/validate';

import { renderIndex } from './renderIndex';

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');

/** 列出某个子目录下的 json 文件（按文件名排序，保证每次生成结果一样） */
function listJson(sub: string): string[] {
  const dir = path.join(CONTENT, sub);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort()
    .map((f) => `${sub}/${f}`);
}

function main(): void {
  const files: ContentFile[] = [];
  const parseErrors: ContentIssue[] = [];

  for (const [sub, kind] of [['articles', 'article'], ['series', 'series']] as const) {
    for (const rel of listJson(sub)) {
      const file = `content/${rel}`;
      const raw = readFileSync(path.join(CONTENT, rel), 'utf8');
      try {
        files.push({ file, kind, data: JSON.parse(raw) });
      } catch (e) {
        parseErrors.push({ file, path: WHOLE_FILE, message: `不是合法的 JSON：${(e as Error).message}` });
      }
    }
  }

  const result = validateContent(files);
  const issues = [...parseErrors, ...result.issues];

  if (issues.length > 0) {
    console.error(`\n✗ 内容校验失败，共 ${issues.length} 处问题：\n`);
    console.error(formatIssues(issues));
    if (result.schemaFailed.length > 0 || parseErrors.length > 0) {
      console.error('提示：字段结构有错的文件，还没检查"词和句子在不在段落里、下标是否越界"这些对应关系，改好后重跑会继续查。');
    }
    console.error('content/index.ts 没有更新。改好后重新运行 npm run content。\n');
    process.exit(1);
  }

  const toEntry = (file: string) => ({
    id: path.basename(file, '.json'),
    relPath: file.replace(/^content\//, ''),
  });
  const output = renderIndex(result.articles.map((a) => toEntry(a.file)), result.series.map((s) => toEntry(s.file)));
  writeFileSync(path.join(CONTENT, 'index.ts'), output);

  console.log(`✓ 内容校验通过：${result.articles.length} 篇文章，${result.series.length} 个系列。已生成 content/index.ts`);
}

main();
