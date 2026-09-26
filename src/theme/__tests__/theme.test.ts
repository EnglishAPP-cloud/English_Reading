import { colors, modeColors, radius, space, textVariants } from '@/theme';

// 防止改 tokens 时手滑写出无效的色值或字号
const COLOR = /^(#[0-9A-Fa-f]{6}|rgba\(\d{1,3},\d{1,3},\d{1,3},(0|1|0?\.\d+)\)|transparent)$/;

describe('theme tokens', () => {
  it('所有颜色都是合法的 #RRGGBB、rgba() 或 transparent', () => {
    const all = [
      ...Object.values(colors),
      ...Object.values(modeColors).flatMap((m) => [m.main, m.soft]),
    ];
    for (const c of all) expect(c).toMatch(COLOR);
  });

  it('间距和圆角都是非负整数', () => {
    for (const v of [...Object.values(space), ...Object.values(radius)]) {
      expect(Number.isInteger(v) && v >= 0).toBe(true);
    }
  });

  it('每个文字样式都有字号和不小于字号的行高', () => {
    for (const v of Object.values(textVariants)) {
      expect(v.fontSize).toBeGreaterThan(0);
      expect(v.lineHeight).toBeGreaterThanOrEqual(v.fontSize);
    }
  });
});
