import { addCheckIn, currentStreak, hasCheckedIn } from '@/logic/streak';

const TODAY = '2026-09-25';

describe('打卡', () => {
  it('同一天只记一次，日期按先后排好', () => {
    let d = addCheckIn([], '2026-09-25');
    d = addCheckIn(d, '2026-09-23');
    d = addCheckIn(d, '2026-09-25');
    expect(d).toEqual(['2026-09-23', '2026-09-25']);
    expect(hasCheckedIn(d, '2026-09-23')).toBe(true);
    expect(hasCheckedIn(d, '2026-09-24')).toBe(false);
  });
});

describe('连续天数', () => {
  it('没有打卡为 0', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('以今天结尾', () => {
    expect(currentStreak(['2026-09-23', '2026-09-24', '2026-09-25'], TODAY)).toBe(3);
  });

  it('以昨天结尾也算（今天还没打卡）', () => {
    expect(currentStreak(['2026-09-23', '2026-09-24'], TODAY)).toBe(2);
  });

  it('最后一次打卡在前天或更早，为 0', () => {
    expect(currentStreak(['2026-09-22', '2026-09-23'], TODAY)).toBe(0);
  });

  it('中间断了只算最后一段', () => {
    expect(currentStreak(['2026-09-20', '2026-09-21', '2026-09-23', '2026-09-24', '2026-09-25'], TODAY)).toBe(3);
  });

  it('跨月也连续', () => {
    expect(currentStreak(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2);
  });

  it('读完一篇后今天打卡，连续天数 +1', () => {
    const before = ['2026-09-23', '2026-09-24'];
    expect(currentStreak(addCheckIn(before, TODAY), TODAY)).toBe(currentStreak(before, TODAY) + 1);
  });

  it('日期顺序乱、有重复也不影响', () => {
    expect(currentStreak(['2026-09-25', '2026-09-24', '2026-09-25'], TODAY)).toBe(2);
  });
});
