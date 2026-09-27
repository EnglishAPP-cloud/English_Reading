import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useUserStore } from '@/store/userStore';

/** 每攒够这么多秒写一次存储（每秒都写会频繁读写手机存储，其他页面也会跟着重渲染） */
const FLUSH_EVERY_SEC = 10;

/** 裸读计时器：文章页持有它，倒计时条订阅它 */
export interface RawReadTimer {
  /** 立即把还没写进进度的秒数（含不到 1 秒的零头）写进去。点"读完了"前调用 */
  flush(): void;
  /** 给 usePendingSeconds 用：订阅"未写入秒数"的变化 */
  subscribe(listener: () => void): () => void;
  /** 已计时、还没写进进度的秒数 */
  getPendingSec(): number;
}

/**
 * 裸读计时：active 为 true 时累计"真实经过的秒数"。
 * - APP 切到后台的时间不算（回到前台接着计）
 * - 秒数先记在本地，每 10 秒、切到后台、离开页面时写进进度
 * - 每秒的变化只通知订阅者（倒计时条），不会让整个文章页每秒重渲染
 * 剩余时间怎么算、超时怎么提示，见 logic/flow.ts 的 rawReadRemaining。
 */
export function useRawReadTimer(articleId: string, active: boolean): RawReadTimer {
  const addRawReadTime = useUserStore((s) => s.addRawReadTime);
  const pending = useRef(0);
  const listeners = useRef(new Set<() => void>());
  /** 计时进行中时指向"把上次到现在的时间记进 pending"的函数 */
  const tickRef = useRef<(() => void) | null>(null);

  const notify = useCallback(() => listeners.current.forEach((l) => l()), []);

  const flush = useCallback(() => {
    tickRef.current?.(); // 先把不到 1 秒的零头也算上
    if (pending.current > 0) {
      const sec = pending.current;
      // 先清零再写 store：任何时刻渲染，"已写入 + 未写入"都不会重复计算
      pending.current = 0;
      addRawReadTime(articleId, sec);
    }
    notify();
  }, [articleId, addRawReadTime, notify]);

  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    let foreground = AppState.currentState === 'active';

    const tick = () => {
      const now = Date.now();
      if (foreground) pending.current += (now - last) / 1000;
      last = now;
    };
    tickRef.current = tick;

    const timer = setInterval(() => {
      tick();
      if (pending.current >= FLUSH_EVERY_SEC) flush();
      else notify();
    }, 1000);

    const sub = AppState.addEventListener('change', (state) => {
      tick(); // 先把切换前的时间结算掉
      foreground = state === 'active';
      last = Date.now();
      if (!foreground) flush(); // 切到后台时写一次，万一 APP 被系统杀掉也不丢
    });

    return () => {
      clearInterval(timer);
      sub.remove();
      flush(); // 离开页面：零头也写进去
      tickRef.current = null;
    };
  }, [active, flush, notify]);

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);
  const getPendingSec = useCallback(() => pending.current, []);

  return useMemo(() => ({ flush, subscribe, getPendingSec }), [flush, subscribe, getPendingSec]);
}

/** 倒计时条用：读取"已计时、还没写进进度的秒数"，每秒更新（只重渲染调用它的组件） */
export function usePendingSeconds(timer: RawReadTimer): number {
  return useSyncExternalStore(timer.subscribe, timer.getPendingSec);
}
