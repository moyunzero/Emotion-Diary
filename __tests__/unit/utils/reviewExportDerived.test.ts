/**
 * reviewExportDerived.test.ts
 * 验证 computeReviewExportDerivedState 的派生统计数值正确性。
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { MoodEntry, MoodLevel, Status } from '../../../types';
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

// Fixed reference date: 2025-03-15 (Saturday, mid-month)
const NOW = new Date('2025-03-15T12:00:00.000Z');

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('computeReviewExportDerivedState', () => {
  beforeAll(async () => {
    const { initI18n } = await import('@/i18n');
    await initI18n();
  });

  it('returns zero totals and null rates when entries array is empty', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'zh-Hans');
    expect(state.compare.current.total).toBe(0);
    expect(state.compare.current.resolutionRate).toBeNull();
    expect(state.closingSummary.totalEntries).toBe(0);
    expect(state.closingSummary.resolutionRatePct).toBeNull();
  });

  it('closingSummary.presetLabel matches zh-Hans preset', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'zh-Hans');
    expect(state.closingSummary.presetLabel).toBe('本月');
  });

  it('closingSummary.presetLabel matches en-US preset', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('en-US');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'en-US');
    expect(state.closingSummary.presetLabel).toMatch(/month/i);
  });

  it('closingSummary.presetLabel is correct for last_week in zh-Hans', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'last_week', NOW, 'zh-Hans');
    expect(state.closingSummary.presetLabel).toBe('上周');
  });

  it('counts entries within the current period correctly', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    // March 2025 entries
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, status: Status.ACTIVE }),
      makeEntry({ id: 'b', timestamp: marchStart + 2000, status: Status.RESOLVED }),
      makeEntry({ id: 'c', timestamp: marchStart + 3000, status: Status.RESOLVED }),
    ];

    const state = computeReviewExportDerivedState(entries, null, 'this_month', NOW, 'zh-Hans');
    expect(state.compare.current.total).toBe(3);
    expect(state.compare.current.resolved).toBe(2);
    expect(state.closingSummary.resolutionRatePct).toBe(67); // round(2/3 * 100)
  });

  it('does not count entries outside the current period', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    // Entry from January — should not appear in this_month (March)
    const janEntry = makeEntry({
      id: 'jan',
      timestamp: new Date('2025-01-10T00:00:00.000Z').getTime(),
      status: Status.RESOLVED,
    });
    const state = computeReviewExportDerivedState([janEntry], null, 'this_month', NOW, 'zh-Hans');
    expect(state.compare.current.total).toBe(0);
  });

  it('companionDays is 0 when firstEntryDate is null', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'zh-Hans');
    expect(state.companionDays).toBe(0);
  });

  it('companionDays is positive when firstEntryDate is set', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const firstEntry = new Date('2025-01-01T00:00:00.000Z').getTime();
    const state = computeReviewExportDerivedState([], firstEntry, 'this_month', NOW, 'zh-Hans');
    // period end is 2025-03-31; days from Jan 1 to Mar 31 ≈ 89 days
    expect(state.companionDays).toBeGreaterThan(0);
  });

  it('monthlySeries has 6 entries', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'zh-Hans');
    expect(state.monthlySeries).toHaveLength(6);
  });

  it('deltaRate is null when previous period has no entries', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, status: Status.RESOLVED }),
    ];
    const state = computeReviewExportDerivedState(entries, null, 'this_month', NOW, 'zh-Hans');
    // previous month (Feb) has no entries → deltaRate is null
    expect(state.compare.deltaRate).toBeNull();
    expect(state.closingSummary.deltaPct).toBeNull();
  });

  it('topWeatherLines is empty when there are no entries in range', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'zh-Hans');
    expect(state.closingSummary.topWeatherLines).toEqual([]);
  });

  it('topWeatherLines uses locale-aware weather labels in zh-Hans', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, moodLevel: MoodLevel.FURIOUS }),
    ];
    const state = computeReviewExportDerivedState(entries, null, 'this_month', NOW, 'zh-Hans');
    expect(state.closingSummary.topWeatherLines.length).toBeGreaterThan(0);
    expect(state.closingSummary.topWeatherLines[0]).toMatch(/天$/);
  });

  it('topWeatherLines uses locale-aware weather labels in en-US', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('en-US');
    const marchStart = new Date('2025-03-01T00:00:00.000Z').getTime();
    const entries = [
      makeEntry({ id: 'a', timestamp: marchStart + 1000, moodLevel: MoodLevel.FURIOUS }),
    ];
    const state = computeReviewExportDerivedState(entries, null, 'this_month', NOW, 'en-US');
    expect(state.closingSummary.topWeatherLines.length).toBeGreaterThan(0);
    expect(state.closingSummary.topWeatherLines[0]).toMatch(/day/i);
  });

  it('periodStartMs and periodEndMs are set on closingSummary', async () => {
    const { i18n } = await import('@/i18n');
    await i18n.changeLanguage('zh-Hans');
    const state = computeReviewExportDerivedState([], null, 'this_month', NOW, 'zh-Hans');
    expect(state.closingSummary.periodStartMs).toBeGreaterThan(0);
    expect(state.closingSummary.periodEndMs).toBeGreaterThan(
      state.closingSummary.periodStartMs,
    );
  });
});
