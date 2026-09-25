import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 复习：今天到期的词卡和句卡，翻面后评分 */
export default function ReviewScreen() {
  return (
    <Screen>
      <Placeholder title="复习" note="词卡正面是原句挖空 + 中文提示；句卡正面是中文译文。评分：忘了 / 模糊 / 记得。" />
    </Screen>
  );
}
