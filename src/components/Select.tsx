import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { borderWidth, colors, opacity, radius, space } from '@/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

type Props = {
  options: readonly string[];
  /** 选中的下标，undefined = 还没选 */
  value: number | undefined;
  onChange: (index: number) => void;
  placeholder: string;
  disabled?: boolean;
  /** 检查后的对错边框 */
  status?: 'ok' | 'bad';
  /** 边框 / 底色（比如挑战练法的紫色） */
  color?: string;
  softColor?: string;
  /** 英文选项用 Lora 字体 */
  english?: boolean;
};

/** 下拉选择：点开从底部弹出选项列表（不引入 picker 库） */
export function Select({ options, value, onChange, placeholder, disabled, status, color, softColor, english }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value === undefined ? undefined : options[value];
  const borderColor = status === 'ok' ? colors.success : status === 'bad' ? colors.danger : (color ?? colors.borderStrong);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor, backgroundColor: softColor ?? colors.surface }]}
      >
        <AppText variant={english ? 'enSmall' : 'small'} tone={selected ? 'text' : 'textMuted'} style={styles.label}>
          {selected ?? placeholder}
        </AppText>
        {!disabled && (
          <AppText variant="small" tone="textMuted">
            ▾
          </AppText>
        )}
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <AppText variant="subheading">{placeholder}</AppText>
        {options.map((o, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            onPress={() => {
              onChange(i);
              setOpen(false);
            }}
            style={({ pressed }) => [styles.option, i === value && styles.optionSelected, pressed && styles.pressed]}
          >
            <AppText variant={english ? 'enBody' : 'body'}>{o}</AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: borderWidth.hairline,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  label: { flex: 1 },
  option: {
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.hairline,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  pressed: { opacity: opacity.pressed },
});
