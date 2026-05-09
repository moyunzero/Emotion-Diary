/**
 * reviewExportClosingInput.test.ts
 * 验证 buildReviewExportClosingSummary 的输出与 computeReviewExportDerivedState 一致，
 * 并覆盖 normalizeFirstEntryDate 的边界情况。
 */

import { MoodEntry, MoodLevel, Status } from '../../../types';
import { buildReviewExportClosingSummary } from '../../../utils/reviewExportClosingInput';
import { computeReviewExportDerivedState } from '../../../utils/reviewExportDerived';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'e1',
    timestamp: Date.now(),
    moodLevel: MoodLevel.ANNOYED,
    content: '',
    deadline: 'later',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    ...overrides,
  };
}

const NOW = new Date('2025-03-15T12:00:00.000Z');

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('buildReviewExportClosingSummary', () => {
  it('returns the same closingSummary as computeReviewExportDerivedState', () => {
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, status: Status.RESOLVED }),
      makeEntry({ id: 'b', timestamp: marchStart + 2000, status: Status.ACTIVE }),
    ];
    const firstEntryDate = new Date('2025-01-01T00:00:00.000Z').getTime();

    const direct = computeReviewExportDerivedState(
      entries,
      firstEntryDate,
      'this_month',
      NOW,
    ).closingSummary;

    const via = buildReviewExportClosingSummary(
      entries,
      firstEntryDate,
      'this_month',
      NOW,
    );

    expect(via).toEqual(direct);
  });

  it('normalizes firstEntryDate of 0 to null (companionDays becomes 0)', () => {
    const summary = buildReviewExportClosingSummary([], 0, 'this_month', NOW);
    expect(summary.companionDays).toBe(0);
  });

  it('normalizes negative firstEntryDate to null', () => {
    const summary = buildReviewExportClosingSummary([], -1, 'this_month', NOW);
    expect(summary.companionDays).toBe(0);
  });

  it('uses valid firstEntryDate when positive', () => {
    const firstEntryDate = new Date('2025-01-01T00:00:00.000Z').getTime();
    const summary = buildReviewExportClosingSummary([], firstEntryDate, 'this_month', NOW);
    expect(summary.companionDays).toBeGreaterThan(0);
  });

  it('presetLabel is correct for last_month', () => {
    const summary = buildReviewExportClosingSummary([], null, 'last_month', NOW);
    expect(summary.presetLabel).toBe('上月');
  });

  it('totalEntries and resolvedEntries are 0 for empty entries', () => {
    const summary = buildReviewExportClosingSummary([], null, 'this_month', NOW);
    expect(summary.totalEntries).toBe(0);
    expect(summary.resolvedEntries).toBe(0);
  });

  it('resolutionRatePct is 100 when all entries are resolved', () => {
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, status: Status.RESOLVED }),
      makeEntry({ id: 'b', timestamp: marchStart + 2000, status: Status.RESOLVED }),
    ];
    const summary = buildReviewExportClosingSummary(entries, null, 'this_month', NOW);
    expect(summary.resolutionRatePct).toBe(100);
  });

  it('resolutionRatePct is 0 when no entries are resolved', () => {
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, status: Status.ACTIVE }),
    ];
    const summary = buildReviewExportClosingSummary(entries, null, 'this_month', NOW);
    expect(summary.resolutionRatePct).toBe(0);
  });

  it('topTriggerLines contains trigger name and count', () => {
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, triggers: ['工作', '学习'] }),
      makeEntry({ id: 'b', timestamp: marchStart + 2000, triggers: ['工作'] }),
    ];
    const summary = buildReviewExportClosingSummary(entries, null, 'this_month', NOW);
    expect(summary.topTriggerLines.length).toBeGreaterThan(0);
    // first line should be 工作 with count 2
    expect(summary.topTriggerLines[0]).toContain('工作');
    expect(summary.topTriggerLines[0]).toContain('2');
  });
});
