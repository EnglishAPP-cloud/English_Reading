import { useCallback, useRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

import { space } from '@/theme';

/** 滚到某段时，段落上方留出的空间 */
const TOP_GAP = space.xxxl * 2;

/**
 * 记录每一段在滚动内容里的位置，用来"滚到第几段"（朗读、标出答案、跳回原文）。
 *
 * 用法：段落列表必须是滚动内容的直接子元素——
 *   列表的 onLayout 用 onListLayout，每段的 onLayout 用 onParagraphLayout(id)。
 */
export function useParagraphPositions() {
  const scrollRef = useRef<ScrollView>(null);
  const listY = useRef(0);
  const paragraphY = useRef<Record<string, number>>({});

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    listY.current = e.nativeEvent.layout.y;
  }, []);

  const onParagraphLayout = useCallback(
    (id: string) => (e: LayoutChangeEvent) => {
      paragraphY.current[id] = e.nativeEvent.layout.y;
    },
    [],
  );

  /** 滚到某段（上面留一点空） */
  const scrollToParagraph = useCallback((id: string, animated = true) => {
    const y = paragraphY.current[id];
    if (y === undefined) return false;
    scrollRef.current?.scrollTo({ y: Math.max(0, listY.current + y - TOP_GAP), animated });
    return true;
  }, []);

  return { scrollRef, onListLayout, onParagraphLayout, scrollToParagraph };
}
