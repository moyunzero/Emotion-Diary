import { Deadline, MoodLevel, Status } from '../../../types';
import {
  DEFAULT_MONTHLY_RESOLUTION_SERIES_MONTHS,
  getMonthlyResolutionRateSeries,
} from '../../../utils/reviewStats';

const entry = (
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

describe('getMonthlyResolutionRateSeries', () => {
  it('returns chronological months oldest to newest', () => {
    const feb = new Date(2025, 1, 15, 12, 0, 0, 0).getTime();
    const mar = new Date(2025, 2, 15, 12, 0, 0, 0).getTime();
    const entries = [
      entry('a', feb, Status.RESOLVED),
      entry('b', mar, Status.ACTIVE),
    ];
    const series = getMonthlyResolutionRateSeries(
      entries,
      2,
      new Date(2025, 2, 20),
    );
    expect(series).toHaveLength(2);
    expect(series[0].monthIndex0).toBe(1);
    expect(series[1].monthIndex0).toBe(2);
    expect(series[0].rate).toBe(1);
    expect(series[1].rate).toBe(0);
  });

  it('exports default months constant', () => {
    expect(DEFAULT_MONTHLY_RESOLUTION_SERIES_MONTHS).toBe(6);
  });
});
