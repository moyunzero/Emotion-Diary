import { MoodLevel, Status } from '../../../types';
import { computeReviewExportDerivedState } from '../../../utils/reviewExportDerived';
import { buildReviewExportClosingSummary } from '../../../utils/reviewExportClosingInput';
import { getReviewExportPeriods } from '../../../utils/reviewStatsTimeRange';

describe('reviewExportDerived', () => {
  it('closingSummary matches buildReviewExportClosingSummary', () => {
    const now = new Date('2025-03-15T12:00:00');
    const entries: Parameters<typeof computeReviewExportDerivedState>[0] = [];
    const derived = computeReviewExportDerivedState(
      entries,
      null,
      'this_month',
      now,
    );
    const fromBuilder = buildReviewExportClosingSummary(
      entries,
      null,
      'this_month',
      now,
    );
    expect(derived.closingSummary).toEqual(fromBuilder);
  });

  it('period bounds match getReviewExportPeriods', () => {
    const now = new Date('2025-03-15T12:00:00');
    const derived = computeReviewExportDerivedState(
      [],
      null,
      'this_month',
      now,
    );
    const { current } = getReviewExportPeriods(now, 'this_month');
    expect(derived.closingSummary.periodStartMs).toBe(current.startMs);
    expect(derived.closingSummary.periodEndMs).toBe(current.endMs);
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
    const derived = computeReviewExportDerivedState(
      entries,
      Date.now(),
      'this_month',
      now,
    );
    expect(derived.closingSummary.totalEntries).toBeGreaterThanOrEqual(1);
    expect(derived.closingSummary.presetLabel).toBe('本月');
  });
});
