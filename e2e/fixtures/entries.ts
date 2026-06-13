import { Deadline, MoodLevel, Status, type MoodEntry } from "../../types";

export const E2E_ENTRY_CONTENT = "E2E 回收站测试条目";

export function createSoftDeletedEntry(
  overrides: Partial<MoodEntry> = {},
): MoodEntry {
  const now = Date.now();
  return {
    id: "e2e-recycle-entry-001",
    timestamp: now - 60_000,
    moodLevel: MoodLevel.UPSET,
    content: E2E_ENTRY_CONTENT,
    deadline: Deadline.TODAY,
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    deletedAt: now,
    ...overrides,
  };
}
