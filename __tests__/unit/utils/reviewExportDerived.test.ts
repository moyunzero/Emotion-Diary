import { MoodLevel, Status } from '../../../types';
import { formatDateChinese, formatMonthDay } from '../../../shared/formatting';
import { REVIEW_PRESET_LABEL } from '../../../shared/time-range';
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

  it('keeps export date semantics after formatting migration', () => {
    const now = new Date('2025-03-15T12:00:00');
    const derived = computeReviewExportDerivedState([], null, 'this_month', now);
    const periodStart = new Date(derived.closingSummary.periodStartMs);
    const periodEnd = new Date(derived.closingSummary.periodEndMs);

    const legacyChineseStart = `${periodStart.getFullYear()}年${periodStart.getMonth() + 1}月${periodStart.getDate()}日`;
    const legacyChineseEnd = `${periodEnd.getFullYear()}年${periodEnd.getMonth() + 1}月${periodEnd.getDate()}日`;
    const legacyMonthDay = `${periodEnd.getMonth() + 1}/${periodEnd.getDate()}`;

    expect(formatDateChinese(derived.closingSummary.periodStartMs)).toBe(legacyChineseStart);
    expect(formatDateChinese(derived.closingSummary.periodEndMs)).toBe(legacyChineseEnd);
    expect(formatMonthDay(derived.closingSummary.periodEndMs)).toBe(legacyMonthDay);
  });

  it('keeps current/previous period semantics stable for all presets', () => {
    const now = new Date('2025-03-15T12:00:00');
    const presets = ['this_week', 'last_week', 'this_month', 'last_month'] as const;

    presets.forEach((preset) => {
      const derived = computeReviewExportDerivedState([], null, preset, now);
      const expected = getReviewExportPeriods(now, preset);

      expect(derived.current).toEqual(expected.current);
      expect(derived.previous).toEqual(expected.previous);
      expect(derived.closingSummary.presetLabel).toBe(REVIEW_PRESET_LABEL[preset]);
    });
  });
});
