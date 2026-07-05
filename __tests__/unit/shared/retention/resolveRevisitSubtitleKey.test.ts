import { MoodLevel, Status, type MoodEntry } from "@/types";
import { resolveRevisitSubtitleKey } from "@/shared/retention/resolveRevisitSubtitleKey";

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

const STAGES = ["seed", "sprout", "seedling", "bud", "bloom"] as const;

describe("resolveRevisitSubtitleKey", () => {
  it("returns seed for empty entries", () => {
    expect(resolveRevisitSubtitleKey([])).toBe("seed");
  });

  it("returns seed or sprout for low resolve rate", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: 1, status: Status.ACTIVE }),
      makeEntry({ id: "b", timestamp: 2, status: Status.ACTIVE }),
    ];
    const stage = resolveRevisitSubtitleKey(entries);
    expect(STAGES).toContain(stage);
    expect(["seed", "sprout"]).toContain(stage);
  });

  it("returns bloom for all-resolved entries", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: 1, status: Status.RESOLVED }),
      makeEntry({ id: "b", timestamp: 2, status: Status.RESOLVED }),
      makeEntry({ id: "c", timestamp: 3, status: Status.RESOLVED }),
    ];
    expect(resolveRevisitSubtitleKey(entries)).toBe("bloom");
  });

  it("returns seedling for 2/4 resolved entries", () => {
    const entries = [
      makeEntry({ id: "a", timestamp: 1, status: Status.RESOLVED }),
      makeEntry({ id: "b", timestamp: 2, status: Status.RESOLVED }),
      makeEntry({ id: "c", timestamp: 3, status: Status.ACTIVE }),
      makeEntry({ id: "d", timestamp: 4, status: Status.ACTIVE }),
    ];
    expect(resolveRevisitSubtitleKey(entries)).toBe("seedling");
  });

  it("does not throw when only soft-deleted entries exist", () => {
    const entries = [
      makeEntry({
        id: "a",
        timestamp: 1,
        deletedAt: Date.now(),
      }),
    ];
    expect(() => resolveRevisitSubtitleKey(entries)).not.toThrow();
    expect(resolveRevisitSubtitleKey(entries)).toBe("seed");
  });
});
