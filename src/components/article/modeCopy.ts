import type { PracticeMode } from '@/logic/flow';

/** 每种练法的说明文字（界面文案，以后按设计稿改） */
export const MODE_TIPS: Record<PracticeMode, string> = {
  deep: '打开「进阶」：点虚线单词看释义，点蓝底句子看长难句拆解。「基础」是每段的中文大意。',
  accurate: '下面每句话都换了说法，回原文找出它对应的原句。',
  challenge: '给每一段选一个小标题，看你能不能抓住全文结构。',
};
