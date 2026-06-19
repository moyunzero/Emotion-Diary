/**
 * AI-03 — buildAiCacheKey locale prefix and clearAiCache invalidation
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@/i18n", () => ({
  i18n: { language: "zh-Hans" },
}));

import {
  __peekAiCacheForTest,
  __seedAiCacheForTest,
  buildAiCacheKey,
  clearAiCache,
} from '@/utils/aiService';

describe('aiService cache', () => {
  beforeEach(() => {
    clearAiCache();
  });

  it('buildAiCacheKey prefixes locale segment', () => {
    expect(buildAiCacheKey('en-US', 'rx_podcast', 'u1', 'week', 12)).toBe(
      'loc:en-US:rx_podcast:u1:week:12',
    );
  });

  it('clearAiCache empties subsequent cache misses', () => {
    const key = buildAiCacheKey('zh-Hans', 'test', 'segment');
    __seedAiCacheForTest(key, 'cached-value');
    expect(__peekAiCacheForTest<string>(key)).toBe('cached-value');

    clearAiCache();
    expect(__peekAiCacheForTest<string>(key)).toBeNull();
  });
});
