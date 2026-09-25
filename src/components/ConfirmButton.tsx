import { useEffect, useState } from 'react';

import { Button } from './Button';

type Props = {
  title: string;
  /** 第一次点击后显示的确认文字 */
  confirmTitle: string;
  onConfirm: () => void;
  small?: boolean;
};

/**
 * 需要二次确认的按钮（重置、清空、取消收藏）：点一次变成"确认…"，3 秒内再点才执行。
 * 不用系统弹窗，所以各平台表现一致。
 */
export function ConfirmButton({ title, confirmTitle, onConfirm, small }: Props) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      small={small}
      variant={armed ? 'primary' : 'ghost'}
      title={armed ? confirmTitle : title}
      onPress={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    />
  );
}
