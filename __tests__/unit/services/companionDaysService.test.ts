import { MoodLevel, Status, type MoodEntry } from '../../../types';
import {
  getEffectiveFirstEntryDateForCompanion,
  resolveCompanionFirstEntryDate,
} from '../../../services/companionDaysService';

function makeEntry(
  partial: Partial<MoodEntry> & { id: string; timestamp: number },
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content ?? 'x',
    deadline: 'later',
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

describe('resolveCompanionFirstEntryDate', () => {
  it('returns null when no known dates and no visible entries', () => {
    expect(resolveCompanionFirstEntryDate([null, undefined], [])).toBeNull();
  });

  it('uses oldest entry when stored date is later (post-merge)', () => {
    const storedOct30 = new Date(2026, 9, 30).getTime();
    const entryMar31 = makeEntry({
      id: 'old',
      timestamp: new Date(2026, 2, 31).getTime(),
    });
    const entryOct30 = makeEntry({
      id: 'new',
      timestamp: storedOct30,
    });
    expect(
      resolveCompanionFirstEntryDate([storedOct30], [entryOct30, entryMar31]),
    ).toBe(entryMar31.timestamp);
  });

  it('ignores soft-deleted older entries', () => {
    const stored = new Date(2026, 9, 30).getTime();
    const softOld = makeEntry({
      id: 'gone',
      timestamp: new Date(2026, 2, 31).getTime(),
      deletedAt: Date.now(),
    });
    const alive = makeEntry({ id: 'alive', timestamp: stored });
    expect(resolveCompanionFirstEntryDate([stored], [softOld, alive])).toBe(
      stored,
    );
  });

  it('keeps known date when it is earlier than entries', () => {
    const known = new Date(2025, 0, 1).getTime();
    const entry = makeEntry({
      id: 'e',
      timestamp: new Date(2026, 9, 30).getTime(),
    });
    expect(resolveCompanionFirstEntryDate([known], [entry])).toBe(known);
  });
});

describe('getEffectiveFirstEntryDateForCompanion', () => {
  it('does not let a late user.firstEntryDate override older entries', () => {
    const userLate = new Date(2026, 9, 30).getTime();
    const oldest = new Date(2026, 2, 31).getTime();
    expect(
      getEffectiveFirstEntryDateForCompanion(userLate, [
        makeEntry({ id: 'a', timestamp: oldest }),
        makeEntry({ id: 'b', timestamp: userLate }),
      ]),
    ).toBe(oldest);
  });
});
