import { Link, type Href } from 'expo-router';

import { AppText } from './AppText';
import { Card } from './Card';

type Props = {
  title: string;
  note: string;
  links?: { label: string; href: Href }[];
};

/** 阶段 1 的页面占位：说明这一页以后放什么，并提供几个跳转验证路由 */
export function Placeholder({ title, note, links = [] }: Props) {
  return (
    <Card>
      <AppText variant="heading">{title}</AppText>
      <AppText variant="small" tone="textMuted">
        {note}
      </AppText>
      {links.map((l) => (
        <Link key={l.label} href={l.href}>
          <AppText variant="small" tone="primary">
            → {l.label}
          </AppText>
        </Link>
      ))}
    </Card>
  );
}
