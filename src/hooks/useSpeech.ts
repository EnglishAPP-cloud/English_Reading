import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 朗读参数：美式英语，稍慢一点（和原型一致） */
const PARAGRAPH_OPTIONS = { language: 'en-US', rate: 0.92 } as const;
const WORD_OPTIONS = { language: 'en-US', rate: 0.85 } as const;

/**
 * 按段朗读：一段读完接着读下一段，speakingIndex 是正在读的段落下标（没在读为 null）。
 * 离开页面时自动停止。用的是手机系统自带的语音。
 */
export function useParagraphSpeech(paragraphs: readonly string[]) {
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  // 每次开始 / 停止都换一个编号，旧的回调发现编号变了就不再继续
  const session = useRef(0);

  const stop = useCallback(() => {
    session.current += 1;
    setSpeakingIndex(null);
    void Speech.stop();
  }, []);

  const speakFrom = useCallback(
    (index: number, id: number) => {
      const text = paragraphs[index];
      if (text === undefined || session.current !== id) {
        if (session.current === id) setSpeakingIndex(null);
        return;
      }
      setSpeakingIndex(index);
      Speech.speak(text, {
        ...PARAGRAPH_OPTIONS,
        onDone: () => speakFrom(index + 1, id),
        onError: () => {
          if (session.current === id) setSpeakingIndex(null);
        },
      });
    },
    [paragraphs],
  );

  const start = useCallback(() => {
    session.current += 1;
    const id = session.current;
    void Speech.stop().then(() => speakFrom(0, id));
  }, [speakFrom]);

  useEffect(() => stop, [stop]);

  return { speakingIndex, speaking: speakingIndex !== null, start, stop };
}

/** 读一个单词 */
export function speakWord(word: string): void {
  void Speech.stop().then(() => Speech.speak(word, WORD_OPTIONS));
}
