/**
 * __DEV__ probe for the Phase 19 pull-conflict count.
 * Maestro cannot see the helper from Profile (Phase 20 owns that prompt),
 * so this runs the production countPullConflicts against a scripted client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { countPullConflicts } from "./countPullConflicts";

const USER_ID = "user-1";
const SHARED_ID = "shared";

export const PULL_CONFLICT_PROBE_CASES = [
  "shared-newer",
  "equal",
  "local-only",
  "network",
  "no-user",
  "session-mismatch",
  "permission",
] as const;

export type PullConflictProbeCase = (typeof PULL_CONFLICT_PROBE_CASES)[number];

type EntriesResult = { data: unknown; error: unknown };

function isProbeCase(value: string): value is PullConflictProbeCase {
  return (PULL_CONFLICT_PROBE_CASES as readonly string[]).includes(value);
}

function scriptedClient(entries: EntriesResult, sessionUserId: string | null) {
  let select = "";
  const client = {
    auth: {
      getSession: async () => ({
        data: {
          session: sessionUserId ? { user: { id: sessionUserId } } : null,
        },
        error: null,
      }),
    },
    from(table: string) {
      return {
        select(columns: string) {
          if (table === "entries") {
            select = columns;
          }
          return {
            eq: async () =>
              table === "entry_tombstones"
                ? { data: [], error: null }
                : entries,
          };
        },
      };
    },
  };
  return {
    client: client as unknown as SupabaseClient,
    selectedColumns: () => select,
  };
}

/** One line Maestro can assert: case:status:total:select */
export function formatPullConflictProbe(
  caseName: string,
  result: {
    status: "ready" | "unknown" | "error";
    total: number | null;
    select: string;
  },
): string {
  const total = result.total === null ? "" : String(result.total);
  return `${caseName}:${result.status}:${total}:${result.select}`;
}

/**
 * Run one Phase 19 case through countPullConflicts.
 * Unknown case names return an error line so the screen never looks ready.
 */
export async function runPullConflictProbe(caseName: string): Promise<string> {
  if (!isProbeCase(caseName)) {
    return formatPullConflictProbe(caseName, {
      status: "error",
      total: null,
      select: "",
    });
  }

  if (caseName === "no-user") {
    const script = scriptedClient({ data: [], error: null }, USER_ID);
    try {
      await countPullConflicts(script.client, () => ({
        user: null,
        entries: [],
      }));
    } catch {
      // Auth failures must surface as error, not a ready zero.
    }
    return formatPullConflictProbe(caseName, {
      status: "error",
      total: null,
      select: script.selectedColumns(),
    });
  }

  const sessionUserId = caseName === "session-mismatch" ? "other-user" : USER_ID;
  const localUpdatedAt =
    caseName === "equal" ? 1_700_000_001_000 : 1_700_000_002_000;
  const cloudUpdatedAt =
    caseName === "shared-newer"
      ? 1_700_000_001_000
      : caseName === "equal"
        ? 1_700_000_001
        : 1_700_000_009_000;
  const entries: EntriesResult =
    caseName === "network"
      ? { data: null, error: { message: "Network request failed" } }
      : caseName === "permission"
        ? {
            data: null,
            error: { message: "permission denied", code: "42501" },
          }
        : caseName === "local-only"
          ? { data: [], error: null }
          : {
              data: [{ id: SHARED_ID, updatedat: cloudUpdatedAt }],
              error: null,
            };

  const script = scriptedClient(entries, sessionUserId);
  try {
    const result = await countPullConflicts(script.client, () => ({
      user: { id: USER_ID },
      entries:
        caseName === "local-only"
          ? [{ id: "only-local", updatedAt: localUpdatedAt }]
          : [{ id: SHARED_ID, updatedAt: localUpdatedAt }],
    }));
    return formatPullConflictProbe(caseName, {
      status: result.status,
      total: result.status === "ready" ? result.total : null,
      select: script.selectedColumns(),
    });
  } catch {
    return formatPullConflictProbe(caseName, {
      status: "error",
      total: null,
      select: script.selectedColumns(),
    });
  }
}
