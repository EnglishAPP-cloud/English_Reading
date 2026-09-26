import { useLocalSearchParams } from 'expo-router';

import { ArticleFlow } from '@/components/article/ArticleFlow';
import { Loading } from '@/components/Loading';
import { useArticle } from '@/content/hooks';

/** 文章页：定向 → 裸读 → 检测 → 练习，四步都在这一页里切换 */
export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: article, loading } = useArticle(id);

  if (loading) return <Loading />;
  if (!article) return <Loading message="找不到这篇文章。" />;
  return <ArticleFlow article={article} />;
}
