/**
 * Read-only preview of how many local rows a pull would replace.
 * Selects id and updatedat only. Network failure is unknown; other entry errors throw.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { i18n } from "../../i18n";
import { fetchUserTombstoneEntryIds } from "../../services/entryTombstones";
import {
  countReplaceableSharedIds,
  type CloudRevisionRow,
} from "../../shared/sync/pullConflictCount";
import { isNetworkError } from "../../utils/errorHandler";
import { logger } from "../../utils/logger";
import { getSyncErrorMessage } from "./syncErrors";

/** Raw PostgREST message. Do not pass getSyncErrorMessage output into isNetworkError. */
function rawErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}

/** Coerce a numeric string in the query step. The compare function still skips non-numbers. */
function updatedatForCount(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const coerced = Number(value);
  return Number.isFinite(coerced) ? coerced : undefined;
}

/** Store fields this preview reads. Diary body is not required. */
type CountPullState = {
  user: { id: string } | null;
  entries: readonly { id: string; updatedAt?: number }[];
};

/** Ready total, or unknown when the cloud id list cannot be fetched over the network. */
export type PullConflictCountResult =
  | { status: "ready"; total: number }
  | { status: "unknown" };

/**
 * Count replaceable shared ids for the signed-in user.
 * Does not take the sync lock and does not write syncStatus.
 */
export async function countPullConflicts(
  client: SupabaseClient,
  get: () => CountPullState,
): Promise<PullConflictCountResult> {
  const { user, entries } = get();

  if (!user) {
    throw new Error(i18n.t("errors.sessionVerifyFailed", { ns: "system" }));
  }

  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError || !session?.user) {
    throw new Error(i18n.t("errors.sessionVerifyFailed", { ns: "system" }));
  }

  if (session.user.id !== user.id) {
    throw new Error(i18n.t("errors.identityVerifyFailed", { ns: "system" }));
  }

  const currentUserId = session.user.id;

  const { tombstoneIdSet, tombstoneFetchError } =
    await fetchUserTombstoneEntryIds(client, currentUserId);

  if (tombstoneFetchError) {
    logger.warn("countPullConflicts", tombstoneFetchError.message);
  }

  const { data, error } = await client
    .from("entries")
    .select("id, updatedat")
    .eq("user_id", currentUserId);

  if (error) {
    if (isNetworkError(rawErrorMessage(error))) {
      return { status: "unknown" };
    }
    throw new Error(getSyncErrorMessage(error));
  }

  const cloudRows: CloudRevisionRow[] = (data ?? []).map((row) => ({
    id: String(row.id),
    updatedat: updatedatForCount(row.updatedat),
  }));
  const localRows = entries.map((entry) => ({
    id: entry.id,
    updatedAt: entry.updatedAt,
  }));
  const total = countReplaceableSharedIds(
    localRows,
    cloudRows,
    tombstoneIdSet,
  );

  return { status: "ready", total };
}
