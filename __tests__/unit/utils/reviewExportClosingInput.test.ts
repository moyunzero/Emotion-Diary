import { MoodLevel, Status } from '../../../types';
import { buildReviewExportClosingSummary } from '../../../utils/reviewExportClosingInput';
import { getReviewExportPeriods } from '@/shared/time-range';

describe('reviewExportClosingInput', () => {
  it('period bounds match getReviewExportPeriods', () => {
    const now = new Date('2025-03-15T12:00:00');
    const entries: Parameters<typeof buildReviewExportClosingSummary>[0] = [];
    const s = buildReviewExportClosingSummary(entries, null, 'this_month', now);
    const { current } = getReviewExportPeriods(now, 'this_month');
    expect(s.periodStartMs).toBe(current.startMs);
    expect(s.periodEndMs).toBe(current.endMs);
  });

  it('builds counts from entries in range', () => {
    const now = new Date('2025-03-15T12:00:00');
    const { current } = getReviewExportPeriods(now, 'this_month');
    const entries = [
      {
        id: '1',
        timestamp: current.startMs + 1000,
        moodLevel: MoodLevel.ANNOYED,
        content: 'x',
        deadline: '今天',
        people: [],
        triggers: ['沟通'],
        status: Status.RESOLVED,
      },
    ];
    const s = buildReviewExportClosingSummary(entries, Date.now(), 'this_month', now);
    expect(s.totalEntries).toBeGreaterThanOrEqual(1);
    expect(s.presetLabel).toBe('本月');
  });

  it('normalizes non-positive firstEntryDate to keep companion days stable', () => {
    const now = new Date('2025-03-15T12:00:00');
    const entries: Parameters<typeof buildReviewExportClosingSummary>[0] = [];
    const fromNull = buildReviewExportClosingSummary(entries, null, 'this_month', now);
    const fromInvalid = buildReviewExportClosingSummary(entries, -1, 'this_month', now);
    expect(fromInvalid.companionDays).toBe(fromNull.companionDays);
  });
});
