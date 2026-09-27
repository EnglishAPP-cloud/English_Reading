import { findWholeWord, sentenceContaining, splitSentences } from '@/logic/text';

describe('findWholeWord', () => {
  it('找到完整单词，返回位置', () => {
    expect(findWholeWord('other people barely register.', 'register')).toBe(20);
    expect(findWholeWord('register now', 'register')).toBe(0);
  });

  it('不匹配单词的一部分', () => {
    expect(findWholeWord('She registered early.', 'register')).toBe(-1);
    expect(findWholeWord('unregister', 'register')).toBe(-1);
  });

  it('区分大小写', () => {
    expect(findWholeWord('Recognition is a basic need.', 'recognition')).toBe(-1);
    expect(findWholeWord('Recognition is a basic need.', 'Recognition')).toBe(0);
  });

  it('词里有正则特殊字符也能找', () => {
    expect(findWholeWord('It costs $5 (roughly).', '(roughly)')).toBe(12);
  });

  it('空词返回 -1', () => {
    expect(findWholeWord('abc', '')).toBe(-1);
  });
});

describe('splitSentences', () => {
  it('按 . ! ? 切句', () => {
    expect(splitSentences('One. Two! Three? Four.')).toEqual(['One.', 'Two!', 'Three?', 'Four.']);
  });

  it('句号后的引号算在前一句', () => {
    expect(splitSentences('He said "Go." Then left.')).toEqual(['He said "Go."', 'Then left.']);
  });

  it('最后一句没有标点也保留', () => {
    expect(splitSentences('First one. Second one')).toEqual(['First one.', 'Second one']);
  });

  it('句号后面没有空格时不断开（比如小数）', () => {
    expect(splitSentences('It rose 3.5 percent. Then fell.')).toEqual(['It rose 3.5 percent.', 'Then fell.']);
  });
});

describe('sentenceContaining', () => {
  const p2 =
    'The writer David Brooks has names for these two types. He calls the first kind Illuminators and the second kind Diminishers. Diminishers are so busy with themselves that other people barely register.';

  it('返回包含该词的那一句', () => {
    expect(sentenceContaining(p2, 'register')).toBe(
      'Diminishers are so busy with themselves that other people barely register.',
    );
    expect(sentenceContaining(p2, 'Illuminators')).toBe(
      'He calls the first kind Illuminators and the second kind Diminishers.',
    );
  });

  it('多句都有时取第一句', () => {
    expect(sentenceContaining(p2, 'Diminishers')).toBe(
      'He calls the first kind Illuminators and the second kind Diminishers.',
    );
  });

  it('找不到就返回整段', () => {
    expect(sentenceContaining('Short text.', 'missing')).toBe('Short text.');
  });
});
