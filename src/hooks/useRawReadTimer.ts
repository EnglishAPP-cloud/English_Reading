import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useUserStore } from '@/store/userStore';

/** 每攒够这么多秒写一次存储（每秒都写会频繁读写手机存储，其他页面也会跟着重渲染） */
const FLUSH_EVERY_SEC = 10;

/**
 * 裸读计时：active 为 true 时累计"真实经过的秒数"。
 * - APP 切到后台的时间不算（回到前台接着计）
 * - 秒数先记在本地，每 10 秒、切到后台、离开页面时写进进度
 * - 返回 pendingSec（还没写进进度的秒数，倒计时显示要加上它）和 flush（立即写入，点"读完了"前调用）
 * 剩余时间怎么算、超时怎么提示，见 logic/flow.ts 的 rawReadRemaining。
 */
export function useRawReadTimer(articleId: string, active: boolean): { pendingSec: number; flush: () => void } {
  const addRawReadTime = useUserStore((s) => s.addRawReadTime);
  const pending = useRef(0);
  const [pendingSec, setPendingSec] = useState(0);

  const flush = useCallback(() => {
    if (pending.current > 0) {
      addRawReadTime(articleId, pending.current);
      pending.current = 0;
    }
    setPendingSec(0);
  }, [articleId, addRawReadTime]);

  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    let foreground = AppState.currentState === 'active';

    /** 把上次到现在的时间记到 pending（后台时间不算） */
    const tick = () => {
      const now = Date.now();
      if (foreground) pending.current += (now - last) / 1000;
      last = now;
    };

    const timer = setInterval(() => {
      tick();
      if (pending.current >= FLUSH_EVERY_SEC) flush();
      else setPendingSec(pending.current);
    }, 1000);

    const sub = AppState.addEventListener('change', (state) => {
      tick(); // 先把切换前的时间结算掉
      foreground = state === 'active';
      last = Date.now();
      if (!foreground) flush(); // 切到后台时写一次，万一 APP 被系统杀掉也不丢
    });

    return () => {
      tick();
      clearInterval(timer);
      sub.remove();
      flush();
    };
  }, [active, flush]);

  return { pendingSec, flush };
}
