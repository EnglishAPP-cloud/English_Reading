import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 设置：重置某一篇的进度；开发环境额外显示调试开关 */
export default function SettingsScreen() {
  return (
    <Screen>
      <Placeholder
        title="设置"
        note={`重置某一篇的进度。${__DEV__ ? '开发环境：预览未发布内容、模拟日期、清空数据。' : ''}`}
      />
    </Screen>
  );
}
