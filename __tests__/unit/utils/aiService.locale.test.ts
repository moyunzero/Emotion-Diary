/**
 * AI-02 — Groq prompts locale-aware; no MoodEntry.content in prompts
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
import type { ReviewExportClosingSummary } from '@/utils/reviewExportDerived';

const GROQ_TEST_KEY = 'gsk_test_key_for_unit_tests_only';

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'e1',
    timestamp: Date.now() - 86400000,
    moodLevel: MoodLevel.ANGRY,
    content: 'SECRET_DIARY_CONTENT_MUST_NOT_LEAK',
    deadline: 'today',
    people: [],
    triggers: ['work'],
    status: Status.ACTIVE,
    ...overrides,
  };
}

function captureGroqPrompts(): { system: string; user: string }[] {
  const captured: { system: string; user: string }[] = [];
  (global.fetch as jest.Mock).mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    captured.push({
      system: body.messages[0].content,
      user: body.messages[1].content,
    });
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                'You showed up for yourself this week — your garden is growing steadier each day.',
            },
          },
        ],
      }),
    };
  });
  return captured;
}

const baseSummary: ReviewExportClosingSummary = {
  presetLabel: 'This month',
  periodStartMs: new Date('2026-06-01').getTime(),
  periodEndMs: new Date('2026-06-19').getTime(),
  companionDays: 42,
  resolutionRatePct: 65,
  deltaPct: 5,
  totalEntries: 12,
  resolvedEntries: 8,
  topWeatherLines: ['Sunny 3 days'],
  topTriggerLines: ['Work · 4 times'],
};

describe('aiService locale prompts', () => {
  beforeAll(async () => {
    const { initI18n } = await import('@/i18n');
    await initI18n();
  });

  beforeEach(() => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = GROQ_TEST_KEY;
    global.fetch = jest.fn();
  });

  it('en-US closing prompt contains English instruction', async () => {
    const captured = captureGroqPrompts();
    const { clearAiCache, generateReviewExportClosingLine } = await import('@/utils/aiService');
    clearAiCache();
    await generateReviewExportClosingLine(baseSummary, 'u1', 'Alex', 'en-US');
    expect(captured[0]?.system).toMatch(/English/i);
    expect(captured[0]?.user).toMatch(/English/i);
  });

  it('en-US podcast prompt contains English instruction', async () => {
    const captured = captureGroqPrompts();
    const { clearAiCache, generateEmotionPodcast } = await import('@/utils/aiService');
    clearAiCache();
    const entries = [
      makeEntry({ id: 'a', timestamp: Date.now() - 1000 }),
      makeEntry({ id: 'b', timestamp: Date.now() - 2000 }),
      makeEntry({ id: 'c', timestamp: Date.now() - 3000 }),
    ];
    await generateEmotionPodcast(entries, 'week', 'u1', 'Alex', 'en-US');
    expect(captured[0]?.system).toMatch(/English/i);
    expect(captured[0]?.user).toMatch(/English/i);
  });

  it('en-US prescription prompt contains English instruction', async () => {
    const captured = captureGroqPrompts();
    const { clearAiCache, generateEmotionPrescription } = await import('@/utils/aiService');
    clearAiCache();
    const entries = [
      makeEntry({ id: 'a' }),
      makeEntry({ id: 'b' }),
      makeEntry({ id: 'c' }),
    ];
    await generateEmotionPrescription('work', MoodLevel.ANGRY, entries, 'u1', 'Alex', undefined, 'en-US');
    expect(captured[0]?.system).toMatch(/English/i);
    expect(captured[0]?.user).toMatch(/English/i);
  });

  it('Groq prompts never include MoodEntry.content', async () => {
    const captured = captureGroqPrompts();
    const { clearAiCache, generateEmotionPodcast, generateEmotionPrescription, generateReviewExportClosingLine } =
      await import('@/utils/aiService');
    clearAiCache();
    const entries = [
      makeEntry({ id: 'a', content: 'TOP_SECRET_DIARY_12345' }),
      makeEntry({ id: 'b', content: 'ANOTHER_SECRET_67890' }),
      makeEntry({ id: 'c', content: 'THIRD_SECRET_ABCDE' }),
    ];
    await generateReviewExportClosingLine(baseSummary, 'u1', 'Alex', 'en-US');
    await generateEmotionPodcast(entries, 'week', 'u1', 'Alex', 'en-US');
    await generateEmotionPrescription('work', MoodLevel.FURIOUS, entries, 'u1', 'Alex', undefined, 'en-US');
    const allPromptText = captured.map((p) => `${p.system}\n${p.user}`).join('\n');
    expect(allPromptText).not.toMatch(/TOP_SECRET_DIARY_12345/);
    expect(allPromptText).not.toMatch(/ANOTHER_SECRET_67890/);
    expect(allPromptText).not.toMatch(/THIRD_SECRET_ABCDE/);
    expect(allPromptText).not.toMatch(/SECRET_DIARY_CONTENT/);
  });

  it('analyzeEmotionCycle uses locale-aware weekday labels', async () => {
    const { analyzeEmotionCycle, clearAiCache } = await import('@/utils/aiService');
    clearAiCache();
    const baseTs = new Date('2026-06-16T10:00:00').getTime();
    const entries: MoodEntry[] = Array.from({ length: 6 }, (_, i) =>
      makeEntry({
        id: `e${i}`,
        timestamp: baseTs - i * 86400000,
        triggers: ['work'],
      }),
    );
    const zh = await analyzeEmotionCycle(entries, 'zh-Hans');
    const en = await analyzeEmotionCycle(entries, 'en-US');
    const zhDay = zh.patterns[0]?.dayOfWeek ?? '';
    const enDay = en.patterns[0]?.dayOfWeek ?? '';
    expect(zhDay).toMatch(/周/);
    expect(enDay).toMatch(/day|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i);
    expect(zhDay).not.toBe(enDay);
  });
});
