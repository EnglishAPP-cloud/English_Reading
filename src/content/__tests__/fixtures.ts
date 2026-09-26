/**
 * 测试用的内容样例：直接用仓库里的真实 JSON，每次返回一份深拷贝，测试里随便改。
 */
import articleJson from '../../../content/articles/hkp-01.json';
import seriesJson from '../../../content/series/how-to-know-a-person.json';

import type { Article, Series } from '../types';

const clone = <T>(x: unknown): T => JSON.parse(JSON.stringify(x)) as T;

export const sampleArticle = (): Article => clone<Article>(articleJson);
export const sampleSeries = (): Series => clone<Series>(seriesJson);

export const ARTICLE_FILE = 'content/articles/hkp-01.json';
export const SERIES_FILE = 'content/series/how-to-know-a-person.json';
