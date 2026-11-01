/**
 * AI-01 — local forecast summary/warnings vary by locale
 */

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'zh-Hans' }]),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { MoodLevel, Status, type MoodEntry } from '@/types';

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'e1',
    timestamp: Date.now() - 86400000,
    moodLevel: MoodLevel.ANGRY,
    content: 'diary body',
    deadline: 'today',
    people: [],
    triggers: ['work'],
    status: Status.ACTIVE,
    ...overrides,
  };
}

describe('aiService forecast locale', () => {
  beforeAll(async () => {
    const { initI18n } = await import('@/i18n');
    await initI18n();
  });

  beforeEach(async () => {
    const { clearAiCache } = await import('@/utils/aiService');
    clearAiCache();
  });

  it('predictEmotionTrend summary differs between zh-Hans and en-US', async () => {
    const { predictEmotionTrend } = await import('@/utils/aiService');
    const baseTs = new Date('2026-06-16T10:00:00').getTime();
    const entries: MoodEntry[] = Array.from({ length: 8 }, (_, i) =>
      makeEntry({
        id: `e${i}`,
        timestamp: baseTs - i * 86400000,
        moodLevel: MoodLevel.FURIOUS,
        triggers: ['work'],
      }),
    );
    const zh = await predictEmotionTrend(entries, 7, 'zh-Hans');
    const en = await predictEmotionTrend(entries, 7, 'en-US');
    expect(zh.summary).not.toBe(en.summary);
    expect(zh.summary.length).toBeGreaterThan(0);
    expect(en.summary.length).toBeGreaterThan(0);
  });

  it('medium-only forecast uses summaryStable (highCount gate)', async () => {
    const { predictEmotionTrend } = await import('@/utils/aiService');
    const { i18n } = await import('@/i18n');
    const dayMs = 86400000;
    // Monday 2026-06-15; 4 weekdays × 2 entries → 25% each → medium (≥20%, <30%)
    const monday = new Date('2026-06-15T10:00:00').getTime();
    const entries: MoodEntry[] = [];
    for (let d = 0; d < 4; d++) {
      for (let n = 0; n < 2; n++) {
        entries.push(
          makeEntry({
            id: `med-${d}-${n}`,
            timestamp: monday + d * dayMs - n * 3600000,
            moodLevel: MoodLevel.FURIOUS,
            triggers: ['work'],
          }),
        );
      }
    }
    expect(entries).toHaveLength(8);

    const forecast = await predictEmotionTrend(entries, 7, 'zh-Hans');
    expect(forecast.warnings.length).toBeGreaterThan(0);
    expect(forecast.warnings.every((w) => w.severity === 'medium')).toBe(true);
    const stable = i18n.getFixedT('zh-Hans', 'ai')('forecast.summaryStable', { days: 7 });
    expect(forecast.summary).toBe(stable);
  });

  it('high fixture forecast uses summaryRisky care copy', async () => {
    const { predictEmotionTrend } = await import('@/utils/aiService');
    const { i18n } = await import('@/i18n');
    const dayMs = 86400000;
    // 10 Mondays → 100% on one weekday → high; length ≠ medium fixture (cache key)
    const monday = new Date('2026-06-15T10:00:00').getTime();
    const entries: MoodEntry[] = Array.from({ length: 10 }, (_, i) =>
      makeEntry({
        id: `hi-${i}`,
        timestamp: monday - i * 7 * dayMs,
        moodLevel: MoodLevel.FURIOUS,
        triggers: ['work'],
      }),
    );

    const forecast = await predictEmotionTrend(entries, 7, 'zh-Hans');
    const highCount = forecast.warnings.filter((w) => w.severity === 'high').length;
    expect(highCount).toBeGreaterThan(0);
    const risky = i18n.getFixedT('zh-Hans', 'ai')('forecast.summaryRisky', {
      days: 7,
      highCount,
    });
    expect(forecast.summary).toBe(risky);
  });

  it('forecast.* locale strings avoid alarm / risk wording', async () => {
    const zh = (await import('@/locales/zh-Hans/ai.json')).default;
    const en = (await import('@/locales/en-US/ai.json')).default;
    const zhForecast = JSON.stringify(zh.forecast);
    const enForecast = JSON.stringify(en.forecast);
    expect(zhForecast).not.toMatch(/高风险|中风险|低风险|提前做好准备/);
    expect(enForecast).not.toMatch(/high-risk|High risk|plan ahead/i);
  });
});
