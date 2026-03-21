import {
  generateReviewExportClosingLine,
  getDefaultReviewExportClosingLine,
} from '../../../utils/aiService';
import type { ReviewExportClosingSummary } from '../../../utils/reviewExportClosingInput';

const baseSummary: ReviewExportClosingSummary = {
  presetLabel: '本月',
  periodStartMs: 0,
  periodEndMs: 1,
  companionDays: 10,
  resolutionRatePct: 50,
  deltaPct: 5,
  totalEntries: 4,
  resolvedEntries: 2,
  topWeatherLines: ['晴燥 2 天'],
  topTriggerLines: ['工作 · 2 次'],
};

describe('generateReviewExportClosingLine', () => {
  const originalKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = originalKey;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns default line when API key is missing', async () => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    const out = await generateReviewExportClosingLine(baseSummary);
    const expected = getDefaultReviewExportClosingLine(baseSummary);
    expect(out.length).toBeGreaterThan(0);
    expect(out).toBe(expected);
  });

  it('returns encouragement when no entries in summary', async () => {
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;
    const empty: ReviewExportClosingSummary = {
      ...baseSummary,
      totalEntries: 0,
      resolvedEntries: 0,
      resolutionRatePct: null,
    };
    const out = await generateReviewExportClosingLine(empty);
    expect(out).toContain('记录');
  });

  it('uses cache for repeated summary with valid API key', async () => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'gsk_test_mock_key';
    const mockFetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '你已经很努力了，继续温柔地照顾自己。' } }],
      }),
    }));
    global.fetch = mockFetch as unknown as typeof fetch;

    const first = await generateReviewExportClosingLine(baseSummary);
    const second = await generateReviewExportClosingLine(baseSummary);

    expect(first).toBe(second);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
