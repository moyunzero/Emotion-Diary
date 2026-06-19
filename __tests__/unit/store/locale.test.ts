/**
 * SYS-06, I18N-02 — setLocale / setLocaleMode reschedule side effects
 */

const mockChangeAppLanguage = jest.fn().mockResolvedValue(undefined);
const mockReschedule = jest.fn().mockResolvedValue(undefined);
const mockSaveLocalePreference = jest.fn().mockResolvedValue(undefined);
const mockClearAiCache = jest.fn();

jest.mock("@/utils/aiService", () => ({
  clearAiCache: (...args: unknown[]) => mockClearAiCache(...args),
}));

jest.mock("@/i18n", () => ({
  changeAppLanguage: (...args: unknown[]) => mockChangeAppLanguage(...args),
}));

jest.mock("@/services/emotionReminders", () => ({
  rescheduleEmotionRemindersFromStorage: (...args: unknown[]) =>
    mockReschedule(...args),
}));

jest.mock("@/services/localeSettings", () => ({
  saveLocalePreference: (...args: unknown[]) =>
    mockSaveLocalePreference(...args),
  loadLocalePreference: jest.fn(),
  DEFAULT_LOCALE_PREFERENCE: { mode: "system" },
}));

jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

import { createLocaleModule } from "@/store/modules/locale";
import type { AppState, LocaleModule } from "@/store/modules/types";

function createLocaleSlice(
  initial: Partial<LocaleModule> = {},
): LocaleModule & { setState: (patch: Partial<LocaleModule>) => void } {
  let slice = {
    localePreference: { mode: "system" as const },
    effectiveLocale: "zh-Hans" as const,
    _hydrateLocale: jest.fn(),
    setLocaleMode: async () => {},
    setLocale: async () => {},
    ...initial,
  } satisfies LocaleModule;

  const set = (
    partial:
      | Partial<AppState>
      | ((state: AppState) => Partial<AppState>),
  ) => {
    const patch =
      typeof partial === "function"
        ? partial(slice as unknown as AppState)
        : partial;
    slice = { ...slice, ...patch } as typeof slice;
  };

  const get = () => slice as unknown as AppState;

  const module = createLocaleModule(set, get);
  return {
    ...module,
    setState: (patch: Partial<LocaleModule>) => {
      slice = { ...slice, ...patch };
    },
  };
}

describe("locale module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("setLocale calls changeAppLanguage then reschedule once", async () => {
    const slice = createLocaleSlice();
    await slice.setLocale("en-US");

    expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
    expect(mockChangeAppLanguage).toHaveBeenCalledWith("en-US");
    expect(mockClearAiCache).toHaveBeenCalledTimes(1);
    expect(mockReschedule).toHaveBeenCalledTimes(1);

    const changeOrder =
      mockChangeAppLanguage.mock.invocationCallOrder[0];
    const clearOrder = mockClearAiCache.mock.invocationCallOrder[0];
    const rescheduleOrder = mockReschedule.mock.invocationCallOrder[0];
    expect(changeOrder).toBeLessThan(clearOrder);
    expect(clearOrder).toBeLessThan(rescheduleOrder);
  });

  it("setLocale calls clearForecast and clearPodcast", async () => {
    const clearForecast = jest.fn();
    const clearPodcast = jest.fn();
    const slice = createLocaleSlice({
      clearForecast,
      clearPodcast,
    } as Partial<AppState>);
    await slice.setLocale("en-US");

    expect(mockClearAiCache).toHaveBeenCalledTimes(1);
    expect(clearForecast).toHaveBeenCalledTimes(1);
    expect(clearPodcast).toHaveBeenCalledTimes(1);
  });

  it("setLocaleMode(system) calls changeAppLanguage then reschedule", async () => {
    const slice = createLocaleSlice({
      localePreference: { mode: "manual", locale: "en-US" },
      effectiveLocale: "en-US",
    });

    await slice.setLocaleMode("system");

    expect(mockChangeAppLanguage).toHaveBeenCalledTimes(1);
    expect(mockClearAiCache).toHaveBeenCalledTimes(1);
    expect(mockReschedule).toHaveBeenCalledTimes(1);

    const changeOrder =
      mockChangeAppLanguage.mock.invocationCallOrder[0];
    const clearOrder = mockClearAiCache.mock.invocationCallOrder[0];
    const rescheduleOrder = mockReschedule.mock.invocationCallOrder[0];
    expect(changeOrder).toBeLessThan(clearOrder);
    expect(clearOrder).toBeLessThan(rescheduleOrder);
  });
});
