import { Deadline, MoodLevel, Status } from '../../../types';
import {
  compareResolutionToPreviousPeriod,
  filterEntriesInRange,
  getResolutionPeriodStats,
} from '../../../utils/reviewStats';

const base = (
  id: string,
  ts: number,
  status: Status,
): import('../../../types').MoodEntry => ({
  id,
  timestamp: ts,
  moodLevel: MoodLevel.ANNOYED,
  content: '',
  deadline: Deadline.TODAY,
  people: [],
  triggers: [],
  status,
});

describe('reviewStats', () => {
  const s = 1000;
  const start = 1000 * s;
  const end = 2000 * s;

  it('filterEntriesInRange keeps timestamps in closed interval', () => {
    const entries = [base('a', start, Status.ACTIVE), base('b', end, Status.ACTIVE)];
    expect(filterEntriesInRange(entries, start, end)).toHaveLength(2);
    expect(filterEntriesInRange(entries, start + 1, end)).toHaveLength(1);
  });

  it('empty list yields null resolution rate', () => {
    const stats = getResolutionPeriodStats([], start, end);
    expect(stats.total).toBe(0);
    expect(stats.resolved).toBe(0);
    expect(stats.resolutionRate).toBeNull();
  });

  it('computes resolution rate in period', () => {
    const entries = [
      base('a', start, Status.RESOLVED),
      base('b', start + 1, Status.RESOLVED),
      base('c', start + 2, Status.ACTIVE),
    ];
    const stats = getResolutionPeriodStats(entries, start, end);
    expect(stats.total).toBe(3);
    expect(stats.resolved).toBe(2);
    expect(stats.resolutionRate).toBeCloseTo(2 / 3);
  });

  it('compareResolutionToPreviousPeriod computes deltaRate', () => {
    const entries = [
      base('a', 500 * s, Status.RESOLVED),
      base('b', 600 * s, Status.ACTIVE),
      base('c', 1500 * s, Status.RESOLVED),
      base('d', 1600 * s, Status.RESOLVED),
    ];
    const cmp = compareResolutionToPreviousPeriod(
      entries,
      500 * s,
      1000 * s,
      1000 * s,
      2000 * s,
    );
    expect(cmp.current.resolutionRate).toBeCloseTo(0.5);
    expect(cmp.previous.resolutionRate).toBeCloseTo(1);
    expect(cmp.deltaRate).toBeCloseTo(-0.5);
  });
});
