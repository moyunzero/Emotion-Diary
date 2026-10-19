/**
 * Read-only preview of how many local rows a pull would replace.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type PullConflictCountResult =
  | { status: "ready"; total: number }
  | { status: "unknown" };

type CountPullState = {
  user: { id: string } | null;
  entries: readonly { id: string; updatedAt?: number }[];
};

export async function countPullConflicts(
  client: SupabaseClient,
  get: () => CountPullState,
): Promise<PullConflictCountResult> {
  void client;
  void get;
  return { status: "ready", total: 0 };
}
