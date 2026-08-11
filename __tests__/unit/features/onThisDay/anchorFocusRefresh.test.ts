/**
 * On This Day retained-screen day rollover: focus refreshes anchorMs.
 */

import fs from 'fs';
import path from 'path';

import { entriesOnThisDayPriorYears } from '@/shared/entries/onThisDay';
import { formatOnThisDayHeroDate } from '@/shared/formatting/onThisDayHeroDate';
import { MoodLevel, Status, type MoodEntry } from '@/types';

const root = path.join(__dirname, '../../../..');

function entryOn(localDay: Date, id: string): MoodEntry {
  const prior = new Date(
    localDay.getFullYear() - 1,
    localDay.getMonth(),
    localDay.getDate(),
    10,
    0,
    0,
    0,
  );
  return {
    id,
    timestamp: prior.getTime(),
    moodLevel: MoodLevel.ANNOYED,
    content: 'otd',
    deadline: 'later',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
  };
}

describe('OnThisDayScreen focus refreshes local-day anchor', () => {
  it('source: setAnchorMs(Date.now()) runs inside useFocusEffect', () => {
    const src = fs.readFileSync(
      path.join(root, 'features/onThisDay/OnThisDayScreen.tsx'),
      'utf8',
    );
    expect(src).toMatch(
      /useFocusEffect\(\s*useCallback\(\(\) => \{\s*setAnchorMs\(Date\.now\(\)\)/,
    );
    expect(src).toContain('useState(() => Date.now())');
    expect(src).not.toMatch(/const anchorMs = useMemo\(\(\) => Date\.now\(\), \[\]\)/);
  });

  it('retained mount across local midnight: new anchor changes hero + query rows', () => {
    const dayA = new Date(2026, 7, 10, 23, 30, 0, 0); // Aug 10
    const dayB = new Date(2026, 7, 11, 0, 15, 0, 0); // Aug 11 (next local day)
    const entries = [
      entryOn(dayA, 'a-y1'),
      entryOn(dayB, 'b-y1'),
    ];

    const rowsA = entriesOnThisDayPriorYears(entries, dayA.getTime());
    const rowsB = entriesOnThisDayPriorYears(entries, dayB.getTime());
    expect(rowsA.map((e) => e.id)).toEqual(['a-y1']);
    expect(rowsB.map((e) => e.id)).toEqual(['b-y1']);

    const heroA = formatOnThisDayHeroDate(dayA.getTime(), 'zh-Hans');
    const heroB = formatOnThisDayHeroDate(dayB.getTime(), 'zh-Hans');
    expect(heroA).not.toBe(heroB);
    expect(heroA).toMatch(/10/);
    expect(heroB).toMatch(/11/);
  });
});
