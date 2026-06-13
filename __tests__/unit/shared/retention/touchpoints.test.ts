import { MoodLevel, Status, type MoodEntry } from "../../../../types";
import {
  daysSinceTimestamp,
  getIsoWeekKey,
  shouldShowRevisitBanner,
  shouldShowWeeklyReviewBanner,
} from "../../../../shared/retention/touchpoints";

function makeEntry(
  partial: Partial<MoodEntry> & { id: string; timestamp: number },
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: "x",
    deadline: "later",
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

describe("touchpoints", () => {
  it("daysSinceTimestamp floors by day", () => {
    const now = Date.UTC(2025, 2, 10, 12);
    const ts = Date.UTC(2025, 2, 8, 12);
    expect(daysSinceTimestamp(ts, now)).toBe(2);
  });

  it("shouldShowRevisitBanner when gap >= 2 days", () => {
    const now = Date.UTC(2025, 2, 10);
    const entries = [
      makeEntry({ id: "a", timestamp: Date.UTC(2025, 2, 5) }),
    ];
    expect(shouldShowRevisitBanner(entries, null, now).show).toBe(true);
    expect(shouldShowRevisitBanner(entries, null, now).daysSince).toBe(5);
  });

  it("shouldShowRevisitBanner hidden when dismissed until future", () => {
    const now = Date.UTC(2025, 2, 10);
    const entries = [
      makeEntry({ id: "a", timestamp: Date.UTC(2025, 2, 1) }),
    ];
    expect(
      shouldShowRevisitBanner(entries, now + 86400000, now).show,
    ).toBe(false);
  });

  it("shouldShowWeeklyReviewBanner on weekend with week entries", () => {
    const saturday = new Date("2025-03-15T12:00:00");
    const entries = [
      makeEntry({
        id: "a",
        timestamp: new Date("2025-03-14T10:00:00").getTime(),
      }),
    ];
    expect(
      shouldShowWeeklyReviewBanner(entries, null, saturday),
    ).toBe(true);
    expect(getIsoWeekKey(saturday)).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("shouldShowWeeklyReviewBanner false when dismissed this week", () => {
    const saturday = new Date("2025-03-15T12:00:00");
    const weekKey = getIsoWeekKey(saturday);
    const entries = [
      makeEntry({
        id: "a",
        timestamp: new Date("2025-03-14T10:00:00").getTime(),
      }),
    ];
    expect(
      shouldShowWeeklyReviewBanner(entries, weekKey, saturday),
    ).toBe(false);
  });
});
