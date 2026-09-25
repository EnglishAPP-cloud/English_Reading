import { formatDuration, formatMinutes } from '@/logic/format';

describe('格式化', () => {
  it('formatDuration', () => {
    expect(formatDuration(240)).toBe('4:00');
    expect(formatDuration(75.6)).toBe('1:16');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(-10)).toBe('0:00');
  });

  it('formatMinutes', () => {
    expect(formatMinutes(240)).toBe('4 分钟');
    expect(formatMinutes(241)).toBe('5 分钟');
    expect(formatMinutes(20)).toBe('1 分钟');
  });
});
