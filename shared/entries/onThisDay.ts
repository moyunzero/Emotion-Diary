/**
 * Pure On This Day prior-year query (QUAL-01/02 · D-01 leap · D-02/A1 · D-03 person).
 * Soft-delete first; local MM-DD via localMonthDayKey (never UTC day math).
 */

import { localMonthDayKey } from "../formatting/localCalendar";
import type { MoodEntry } from "../../types";
import { Status } from "../../types";
import { entriesForPerson } from "./personQueries";
import { excludeSoftDeletedEntries } from "./visibility";

/**
 * Default REL helpers mirror Dashboard「全部」: ACTIVE / RESOLVED / BURNED only.
 * A1 — PROCESSING is excluded (not in D-02; same as personQueries / dashboardFilter).
 */
const REL_STATUSES = new Set<Status>([
  Status.ACTIVE,
  Status.RESOLVED,
  Status.BURNED,
]);

export type OnThisDayOpts = {
  /** Exact people.includes match (D-03); when set, reuses entriesForPerson gates. */
  person?: string;
};

/**
 * Prior-year entries whose local MM-DD equals the anchor's local MM-DD.
 *
 * - QUAL-01: soft-deleted excluded first (via visibility / entriesForPerson)
 * - QUAL-02: match via localMonthDayKey only
 * - D-01: Feb 29 matches only Feb 29 (exact MM-DD; no fold to Feb 28 / Mar 1)
 * - D-02 + A1: ACTIVE / RESOLVED / BURNED; PROCESSING excluded
 * - D-03: optional person uses exact includes (entriesForPerson)
 * - Same calendar year as anchor excluded; newest timestamp first
 */
export function entriesOnThisDayPriorYears(
  entries: readonly MoodEntry[],
  anchorMs: number,
  opts?: OnThisDayOpts,
): MoodEntry[] {
  const anchorYear = new Date(anchorMs).getFullYear();
  const md = localMonthDayKey(anchorMs);

  const pool =
    opts?.person !== undefined
      ? entriesForPerson(entries, opts.person)
      : excludeSoftDeletedEntries(entries).filter((e) =>
          REL_STATUSES.has(e.status),
        );

  return pool
    .filter((e) => {
      if (localMonthDayKey(e.timestamp) !== md) return false;
      return new Date(e.timestamp).getFullYear() < anchorYear;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}
