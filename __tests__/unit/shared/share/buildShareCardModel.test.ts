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
  buildBurnShareCardModel,
  buildResolveShareCardModel,
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
      });
      assertNoPii(model);
      expect(model.variant).toBe("week");
      expect(model.closingOrRitualLine).toBe("本周温柔收尾");
    });
  });

  describe("buildResolveShareCardModel", () => {
    it("uses weather condition and global resolve rate only", () => {
      const entries = [
        makeEntry({ status: Status.RESOLVED }),
        makeEntry({ id: "e2", status: Status.ACTIVE }),
      ];
      const model = buildResolveShareCardModel({
        entries,
        weatherCondition: "cloudy",
        effectiveLocale: "zh-Hans",
        footerDateMs: Date.now(),
      });
      assertNoPii(model);
      expect(model.variant).toBe("resolve");
      expect(model.weatherBucket).toBe("cloudy");
      expect(model.ritualAccent).toBe("resolve");
      expect(model.weatherNarrativeLine.length).toBeGreaterThan(0);
    });
  });

  describe("buildBurnShareCardModel", () => {
    it("has variant burn and ritualAccent burn with no entry fields", () => {
      const model = buildBurnShareCardModel({
        effectiveLocale: "en-US",
        footerDateMs: Date.now(),
      });
      assertNoPii(model);
      expect(model.variant).toBe("burn");
      expect(model.ritualAccent).toBe("burn");
      expect(model.closingOrRitualLine.length).toBeGreaterThan(0);
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
      });
      expect(without.userSnippet).toBeUndefined();

      const long = "a".repeat(100);
      const withSnippet = buildWeekShareCardModel({
        derived,
        closingLine: "line",
        effectiveLocale: "zh-Hans",
        userSnippet: `  ${long}  `,
      });
      expect(withSnippet.userSnippet).toHaveLength(80);
    });
  });
});
