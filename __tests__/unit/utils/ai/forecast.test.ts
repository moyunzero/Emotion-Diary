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
});
