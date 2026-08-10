/**
 * Pure person filter + aggregate helpers for Phase 14 timeline.
 * QUAL-01 soft-delete · D-02 statuses · A1 PROCESSING · D-03 exact · D-04 other
 */

import {
  growthStageFromRate,
  type GrowthStageId,
} from "@/shared/garden/growthStage";
import type { MoodEntry } from "../../types";
import { Status } from "../../types";
import { excludeSoftDeletedEntries } from "./visibility";

/**
 * Default REL helpers mirror Dashboard「全部」: ACTIVE / RESOLVED / BURNED only.
 * A1 — PROCESSING is excluded (not in D-02; same as dashboardFilter dropping it).
 */
const REL_STATUSES = new Set<Status>([
  Status.ACTIVE,
  Status.RESOLVED,
  Status.BURNED,
]);

function passesRelGates(entry: MoodEntry): boolean {
  return REL_STATUSES.has(entry.status);
}

/**
 * Soft-delete first (QUAL-01), then D-02/A1 status gate, exact people.includes (D-03).
 * `"other"` is first-class (D-04). Newest timestamp first.
 */
export function entriesForPerson(
  entries: readonly MoodEntry[],
  person: string,
): MoodEntry[] {
  return excludeSoftDeletedEntries(entries)
    .filter((e) => passesRelGates(e) && e.people.includes(person))
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Distinct people tags after soft-delete + D-02/A1 gate.
 * Stable first-seen order; `"other"` not special-cased (D-04).
 */
export function listDistinctPeople(entries: readonly MoodEntry[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of excludeSoftDeletedEntries(entries)) {
    if (!passesRelGates(entry)) continue;
    for (const person of entry.people) {
      if (seen.has(person)) continue;
      seen.add(person);
      out.push(person);
    }
  }
  return out;
}

export type PersonTimelineAggregate = {
  person: string;
  entryCount: number;
  latestTimestamp: number | null;
  resolvedCount: number;
  resolveRate: number;
  growthStage: GrowthStageId;
};

/** Aggregate from entriesForPerson only — inherits QUAL-01 / D-02 / D-03 / D-04 / A1. */
export function aggregateForPerson(
  entries: readonly MoodEntry[],
  person: string,
): PersonTimelineAggregate {
  const list = entriesForPerson(entries, person);
  const resolvedCount = list.filter((e) => e.status === Status.RESOLVED).length;
  const entryCount = list.length;
  const resolveRate = entryCount > 0 ? resolvedCount / entryCount : 0;
  return {
    person,
    entryCount,
    latestTimestamp: list[0]?.timestamp ?? null,
    resolvedCount,
    resolveRate,
    growthStage: growthStageFromRate(resolveRate),
  };
}
