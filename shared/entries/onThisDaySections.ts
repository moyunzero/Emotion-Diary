/**
 * Presentation flatten for On This Day FlashList (REL-05 / D-02).
 * Year headers when local calendar year changes; preserves input order.
 * Does not re-apply soft-delete or MM-DD filters (D-06).
 */

import type { MoodEntry } from '../../types';

export type OnThisDayListItem =
  | { type: 'year'; year: number }
  | { type: 'entry'; entry: MoodEntry };

/**
 * Flatten newest-first MoodEntry rows into year|entry list items.
 * Emits a year header when `getFullYear()` differs from the previous row.
 */
export function buildOnThisDaySections(rows: MoodEntry[]): OnThisDayListItem[] {
  const out: OnThisDayListItem[] = [];
  let lastYear: number | null = null;
  for (const entry of rows) {
    const year = new Date(entry.timestamp).getFullYear();
    if (year !== lastYear) {
      out.push({ type: 'year', year });
      lastYear = year;
    }
    out.push({ type: 'entry', entry });
  }
  return out;
}
