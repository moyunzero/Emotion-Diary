/**
 * Pure guest-snapshot audio strip (SEC-01 D-04).
 * After Edge delete succeeds: keep diary text; drop audios arrays / remoteUrl retention.
 */

import { MoodEntry } from '../../types';

/**
 * Returns new entries with audios omitted. Does not mutate input.
 */
export function stripAudiosFromEntries(entries: MoodEntry[]): MoodEntry[] {
  return entries.map((entry) => {
    if (entry.audios === undefined) {
      return entry;
    }
    const { audios: _audios, ...rest } = entry;
    return rest;
  });
}
