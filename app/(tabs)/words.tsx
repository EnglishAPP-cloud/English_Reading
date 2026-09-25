import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 单词：收藏列表 + 复习入口 */
export default function WordsScreen() {
  return (
    <Screen>
      <Placeholder
        title="单词"
        note="顶部显示今天要复习几个，下面分「学习中 / 已掌握」列出全部收藏。"
        links={[
          { label: '开始复习', href: '/review' },
          { label: '收藏详情（示例）', href: '/favorite/example' },
        ]}
      />
    </Screen>
  );
}
