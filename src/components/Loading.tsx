import { Screen } from './Screen';
import { AppText } from './AppText';

/** 读取中 / 找不到内容时的整页提示 */
export function Loading({ message = '加载中…' }: { message?: string }) {
  return (
    <Screen>
      <AppText tone="textMuted">{message}</AppText>
    </Screen>
  );
}
