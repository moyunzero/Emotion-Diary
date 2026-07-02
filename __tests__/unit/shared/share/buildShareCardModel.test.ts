jest.mock("expo-localization", () => ({
  getLocales: jest.fn(() => [{ languageTag: "zh-Hans" }]),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn(),
}));

import { Deadline, MoodEntry, MoodLevel, Status } from "@/types";
import type { ReviewExportDerivedState } from "@/utils/reviewExportDerived";
import { computeReviewExportDerivedState } from "@/utils/reviewExportDerived";
import {
  buildWeekShareCardModel,
  type ShareCardModel,
} from "@/shared/share/buildShareCardModel";

const PII_CONTENT = "secret diary content xyz";
const PII_PERSON = "Alice SecretName";
const PII_TRIGGER = "work-stress-trigger";

function makeEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: "e1",
    timestamp: Date.now(),
    moodLevel: MoodLevel.ANNOYED,
    content: PII_CONTENT,
    deadline: Deadline.LATER,
    people: [PII_PERSON],
    triggers: [PII_TRIGGER],
    status: Status.ACTIVE,
    ...overrides,
  };
}

const NOW = new Date("2025-03-15T12:00:00.000Z");

function assertNoPii(model: ShareCardModel): void {
  const json = JSON.stringify(model);
  expect(json).not.toContain(PII_CONTENT);
  expect(json).not.toContain(PII_PERSON);
  expect(json).not.toContain(PII_TRIGGER);
  expect(json).not.toMatch(/"people"/);
  expect(json).not.toMatch(/"triggers"/);
  expect(json).not.toMatch(/"content"/);
  expect(json).not.toMatch(/topTriggers/);
}

describe("buildShareCardModel", () => {
  beforeAll(async () => {
    const { initI18n } = await import("@/i18n");
    await initI18n();
  });

  describe("buildWeekShareCardModel", () => {
    it("never includes people triggers or entry content in output", () => {
      const entries = [
        makeEntry({
          timestamp: new Date("2025-03-10T12:00:00.000Z").getTime(),
        }),
      ];
      const derived = computeReviewExportDerivedState(
        entries,
        null,
        "this_month",
        NOW,
        "zh-Hans",
      );
      const model = buildWeekShareCardModel({
        derived,
        closingLine: "本周温柔收尾",
        effectiveLocale: "zh-Hans",
        periodEntries: entries,
      });
      assertNoPii(model);
      expect(model.variant).toBe("week");
      expect(model.closingOrRitualLine).toBe("本周温柔收尾");
    });

    it("shows empty-period weather copy when no stats in range", () => {
      const derived = computeReviewExportDerivedState(
        [],
        null,
        "last_week",
        NOW,
        "zh-Hans",
      );
      const model = buildWeekShareCardModel({
        derived,
        closingLine: "line",
        effectiveLocale: "zh-Hans",
        periodEntries: [],
      });
      expect(model.weatherNarrativeLine).toMatch(/积累|耐心/);
    });

    it("derives weather narrative from period entries not empty stub", () => {
      const calmEntries = [
        makeEntry({
          moodLevel: MoodLevel.ANNOYED,
          timestamp: new Date("2025-03-10T12:00:00.000Z").getTime(),
        }),
      ];
      const heavyEntries = [
        makeEntry({
          moodLevel: MoodLevel.FURIOUS,
          timestamp: new Date("2025-03-10T12:00:00.000Z").getTime(),
        }),
      ];
      const calmDerived = computeReviewExportDerivedState(
        calmEntries,
        null,
        "this_month",
        NOW,
        "zh-Hans",
      );
      const heavyDerived = computeReviewExportDerivedState(
        heavyEntries,
        null,
        "this_month",
        NOW,
        "zh-Hans",
      );
      const calmModel = buildWeekShareCardModel({
        derived: calmDerived,
        closingLine: "a",
        effectiveLocale: "zh-Hans",
        periodEntries: calmEntries,
      });
      const heavyModel = buildWeekShareCardModel({
        derived: heavyDerived,
        closingLine: "b",
        effectiveLocale: "zh-Hans",
        periodEntries: heavyEntries,
      });
      expect(calmModel.weatherBucket).toBe("sunny");
      expect(heavyModel.weatherBucket).toBe("stormy");
      expect(calmModel.weatherNarrativeLine).not.toBe(
        heavyModel.weatherNarrativeLine,
      );
    });
  });

  describe("userSnippet", () => {
    it("only present when passed and trimmed max 80 chars", () => {
      const derived = computeReviewExportDerivedState(
        [],
        null,
        "this_month",
        NOW,
        "zh-Hans",
      );
      const without = buildWeekShareCardModel({
        derived,
        closingLine: "line",
        effectiveLocale: "zh-Hans",
        periodEntries: [],
      });
      expect(without.userSnippet).toBeUndefined();

      const long = "a".repeat(100);
      const withSnippet = buildWeekShareCardModel({
        derived,
        closingLine: "line",
        effectiveLocale: "zh-Hans",
        periodEntries: [],
        userSnippet: `  ${long}  `,
      });
      expect(withSnippet.userSnippet).toHaveLength(80);
    });
  });
});
