import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

/** 知识库 */
export default function LibraryScreen() {
  return (
    <Screen>
      <Placeholder
        title="知识库"
        note="上面是系列卡片，下面是单篇列表，可以按栏目筛选。"
        links={[{ label: '打开示例系列', href: '/series/how-to-know-a-person' }]}
      />
    </Screen>
  );
}
