/**
 * 文本处理的纯函数：找单词、切句子。
 * 内容校验脚本和页面高亮用的是同一套规则，保证"校验通过的内容一定能高亮出来"。
 */

/** 把字符串里的正则特殊字符转义，用于拼正则 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 在一段英文里找某个词作为"完整单词"第一次出现的位置（区分大小写）。
 * "完整单词"指前后不是字母、数字或下划线，比如在 "registered" 里找不到 "register"。
 * 找不到返回 -1。
 */
export function findWholeWord(text: string, word: string): number {
  if (!word) return -1;
  // 不用"后行断言"(?<!)，老版本的 JS 引擎不一定支持；改成把前一个字符一起匹配，再把下标挪回来
  const re = new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(word)}(?![A-Za-z0-9_])`);
  const m = re.exec(text);
  return m ? m.index + (m[1]?.length ?? 0) : -1;
}

/**
 * 把一段英文切成句子：在 . ! ? 后面跟空格（或段落结尾）的地方断开。
 * 句号后紧跟的引号、括号算在前一句里。
 * 局限：Mr. / Dr. / U.S. 这类缩写会被误断，内容里遇到再说。
 */
export function splitSentences(paragraph: string): string[] {
  const out: string[] = [];
  const end = /[.!?]+["')\]”’]*(?=\s|$)/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = end.exec(paragraph)) !== null) {
    const stop = m.index + m[0].length;
    out.push(paragraph.slice(start, stop).trim());
    start = stop;
  }
  out.push(paragraph.slice(start).trim()); // 最后一句没有标点的情况
  return out.filter((s) => s.length > 0);
}

/** 找出段落里包含某个词（完整单词）的那一句；找不到就返回整段 */
export function sentenceContaining(paragraph: string, word: string): string {
  return splitSentences(paragraph).find((s) => findWholeWord(s, word) >= 0) ?? paragraph.trim();
}
