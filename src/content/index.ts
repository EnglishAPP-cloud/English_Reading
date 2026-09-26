/**
 * 当前使用的内容来源。以后换成云端，只改这里这一行：
 *   export const contentRepository: ContentRepository = new CloudBaseContentRepository(...);
 */
import { rawArticles, rawSeries } from '../../content';

import { LocalContentRepository } from './localRepository';
import type { ContentRepository } from './repository';

export const contentRepository: ContentRepository = new LocalContentRepository(rawArticles, rawSeries);

export type { ContentRepository, PublishedQuery } from './repository';
export * from './types';
