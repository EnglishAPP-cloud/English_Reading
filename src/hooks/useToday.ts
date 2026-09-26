import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayLocal, type LocalDate } from '@/logic/date';
import { effectiveDateOffset } from '@/store/devSettings';
import { useUserStore } from '@/store/userStore';

/** 距离下一个本地零点还有多少毫秒 */
function msUntilMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/**
 * 页面用的"今天"（本地日期，含开发用的日期偏移）。
 * APP 回到前台、或者跨过零点时自动刷新——所以改了手机日期，切回 APP 就能生效。
 */
export function useToday(): LocalDate {
  // 开发用的日期偏移只在开发环境生效
  const offset = useUserStore((s) => effectiveDateOffset(s.settings));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    const timer = setTimeout(() => setNow(new Date()), msUntilMidnight(now) + 1000);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [now]);

  return todayLocal(now, offset);
}
