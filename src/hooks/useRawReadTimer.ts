import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useUserStore } from '@/store/userStore';

/**
 * 裸读计时：active 为 true 时，每秒把"真实经过的秒数"累加到进度里。
 * - APP 切到后台的时间不算（回到前台接着计）
 * - 离开页面（active 变 false 或卸载）时把零头也记上
 * 剩余时间怎么算、超时怎么提示，见 logic/flow.ts 的 rawReadRemaining。
 */
export function useRawReadTimer(articleId: string, active: boolean): void {
  const addRawReadTime = useUserStore((s) => s.addRawReadTime);

  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    let foreground = AppState.currentState === 'active';

    const tick = () => {
      const now = Date.now();
      if (foreground) addRawReadTime(articleId, (now - last) / 1000);
      last = now;
    };

    const timer = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (state) => {
      tick(); // 先把切换前的时间结算掉
      foreground = state === 'active';
      last = Date.now();
    });

    return () => {
      tick();
      clearInterval(timer);
      sub.remove();
    };
  }, [active, articleId, addRawReadTime]);
}
