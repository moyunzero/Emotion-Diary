/**
 * FMT-01 — formatLocaleDate and locale-aware formatRelativeDayLabel
 */

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('formatLocaleDate', () => {
  beforeAll(async () => {
    const { initI18n } = await import('@/i18n');
    await initI18n();
  });

  it('formats zh-Hans long date with year', async () => {
    const { formatLocaleDate } = await import('@/shared/formatting/date');
    expect(formatLocaleDate(new Date('2026-06-19'), 'zh-Hans', 'long')).toMatch(/2026/);
  });

  it('formats en-US long date with June or year', async () => {
    const { formatLocaleDate } = await import('@/shared/formatting/date');
    expect(formatLocaleDate(new Date('2026-06-19'), 'en-US', 'long')).toMatch(/June|2026/);
  });

  it('returns unknown label for invalid input', async () => {
    const { formatLocaleDate } = await import('@/shared/formatting/date');
    expect(formatLocaleDate(null, 'zh-Hans', 'long')).toMatch(/未知/);
    expect(formatLocaleDate(null, 'en-US', 'long')).toMatch(/Unknown/i);
  });
});

describe('formatRelativeDayLabel', () => {
  beforeAll(async () => {
    const { initI18n } = await import('@/i18n');
    await initI18n();
  });

  it('returns Today in en-US', async () => {
    const { i18n } = await import('@/i18n');
    const { formatRelativeDayLabel } = await import('@/shared/formatting/date');
    await i18n.changeLanguage('en-US');
    const today = new Date('2026-06-19T12:00:00');
    expect(formatRelativeDayLabel(today, today, 'en-US')).toMatch(/Today/i);
  });

  it('returns 今天 in zh-Hans', async () => {
    const { i18n } = await import('@/i18n');
    const { formatRelativeDayLabel } = await import('@/shared/formatting/date');
    await i18n.changeLanguage('zh-Hans');
    const today = new Date('2026-06-19T12:00:00');
    expect(formatRelativeDayLabel(today, today, 'zh-Hans')).toMatch(/今天/);
  });

  it('formatDateChinese remains a zh-Hans alias', async () => {
    const { formatDateChinese } = await import('@/shared/formatting/date');
    expect(formatDateChinese(new Date('2026-06-19'))).toMatch(/2026/);
  });
});
