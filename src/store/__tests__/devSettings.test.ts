import { effectiveDateOffset, effectivePreview } from '@/store/devSettings';

describe('开发专用设置只在开发环境生效', () => {
  const settings = { devDateOffsetDays: 3, previewUnpublished: true };

  it('开发环境：按设置生效', () => {
    expect(effectiveDateOffset(settings, true)).toBe(3);
    expect(effectivePreview(settings, true)).toBe(true);
  });

  it('正式版：存储里留有值也一律按关闭处理', () => {
    expect(effectiveDateOffset(settings, false)).toBe(0);
    expect(effectivePreview(settings, false)).toBe(false);
  });
});
