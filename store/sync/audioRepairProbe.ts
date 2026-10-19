/**
 * __DEV__ probe for legacy audio re-upload and real playback.
 * Repair lines call repairActionForAudio. Playback drives audioCoordinator.
 */

import {
  cacheDirectory,
  deleteAsync,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system";

import { repairActionForAudio } from "../../services/audioSync";
import type { AudioData } from "../../types";

const BYTES_NAME = "repair-bytes.m4a";
const EMPTY_NAME = "repair-empty.m4a";
const MISSING_URI = "file:///missing/心晴 不存在.m4a";

export type PlaybackSample = {
  playbackPosition: number;
  currentAudioId: string | null;
};

const PLAYBACK_POLL_MS = 100;
const PLAYBACK_POLLS = 20;

/**
 * Hearable means the playhead moved, or the clip finished and left the player.
 * A stuck isPlaying flag with position 0 stays silent.
 */
export async function classifyOnePlayback(input: {
  audioId: string;
  play: () => Promise<{ ok: boolean }>;
  read: () => PlaybackSample;
  sleep: (ms: number) => Promise<void>;
}): Promise<"ok" | "fail" | "silent"> {
  let result: { ok: boolean };
  try {
    result = await input.play();
  } catch {
    return "fail";
  }
  if (!result.ok) return "fail";

  for (let i = 0; i < PLAYBACK_POLLS; i++) {
    await input.sleep(PLAYBACK_POLL_MS);
    const sample = input.read();
    if (sample.playbackPosition > 0.01) return "ok";
    if (sample.currentAudioId !== input.audioId) return "ok";
  }
  return "silent";
}

/**
 * One line Maestro can assert.
 * Pass: at least one clip was heard, and none stayed on a silent playhead.
 * Clips the player refuses (missing file, path text stored as the object) count as fail, not pass-blockers.
 */
export function formatPlaybackAudit(
  counts: { ok: number; fail: number; silent: number },
  failedIds: string[],
): string {
  const total = counts.ok + counts.fail + counts.silent;
  const status = counts.ok > 0 && counts.silent === 0 ? "pass" : "fail";
  const ids = failedIds.slice(0, 8).join(",");
  const suffix = ids ? `:ids=${ids}` : "";
  return `playback:${status}:ok=${counts.ok}:fail=${counts.fail}:silent=${counts.silent}:total=${total}${suffix}`;
}

async function sampleUri(name: string, body: "bytes" | "empty"): Promise<string> {
  const root = cacheDirectory ?? "file:///cache/";
  const uri = `${root}${name}`;
  if (body === "empty") {
    await writeAsStringAsync(uri, "");
  } else {
    await writeAsStringAsync(uri, "aGVsbG8=", { encoding: EncodingType.Base64 });
  }
  return uri;
}

/**
 * Boundary decisions for re-upload. Does not upload and does not touch diary text.
 */
export async function runRepairBoundaryReport(): Promise<string> {
  const bytes = await sampleUri(BYTES_NAME, "bytes");
  const empty = await sampleUri(EMPTY_NAME, "empty");
  const cases: { label: string; audio: Parameters<typeof repairActionForAudio>[0] }[] = [
    {
      label: "synced-https-missing",
      audio: {
        localUri: MISSING_URI,
        remoteUrl: "https://cdn.example/a.m4a",
        syncStatus: "synced",
      },
    },
    {
      label: "synced-https-empty",
      audio: {
        localUri: empty,
        remoteUrl: "https://cdn.example/a.m4a",
        syncStatus: "synced",
      },
    },
    {
      label: "synced-object-path",
      audio: {
        localUri: bytes,
        remoteUrl: "user-1/a.m4a",
        syncStatus: "synced",
      },
    },
    {
      label: "synced-file-url",
      audio: {
        localUri: bytes,
        remoteUrl: "file:///already.m4a",
        syncStatus: "synced",
      },
    },
    {
      label: "synced-spaced-https",
      audio: {
        localUri: bytes,
        remoteUrl: " https://cdn.example/a.m4a",
        syncStatus: "synced",
      },
    },
    {
      label: "synced-no-remote",
      audio: { localUri: bytes, syncStatus: "synced" },
    },
    {
      label: "uppercase-http",
      audio: {
        localUri: bytes,
        remoteUrl: "HTTP://cdn.example/a.m4a",
        syncStatus: "synced",
      },
    },
    {
      label: "pending-file",
      audio: { localUri: bytes, syncStatus: "pending" },
    },
    {
      label: "failed-file",
      audio: { localUri: bytes, syncStatus: "failed" },
    },
    {
      label: "pending-null-remote",
      audio: { localUri: bytes, remoteUrl: undefined, syncStatus: "pending" },
    },
    {
      label: "pending-missing",
      audio: { localUri: MISSING_URI, syncStatus: "pending" },
    },
    {
      label: "failed-empty",
      audio: {
        localUri: empty,
        remoteUrl: "https://cdn.example/a.m4a",
        syncStatus: "failed",
      },
    },
    {
      label: "pending-unicode-missing",
      audio: { localUri: MISSING_URI, syncStatus: "pending" },
    },
    {
      label: "no-local",
      audio: { remoteUrl: "https://cdn.example/a.m4a", syncStatus: "pending" },
    },
  ];

  try {
    const parts: string[] = [];
    for (const item of cases) {
      parts.push(`${item.label}=${await repairActionForAudio(item.audio)}`);
    }
    return `repair:${parts.join("|")}`;
  } finally {
    await deleteAsync(bytes, { idempotent: true }).catch(() => undefined);
    await deleteAsync(empty, { idempotent: true }).catch(() => undefined);
  }
}

let playbackTicket = 0;

/**
 * Play every stored clip through the production coordinator.
 * ok means the playhead moved or the clip finished. isPlaying alone is not enough.
 * A newer call cancels the previous one so a remount does not play the list twice.
 */
export async function auditStorePlayback(deps: {
  entries: readonly { id: string; audios?: readonly AudioData[] }[];
  play: (entryId: string, audio: AudioData) => Promise<{ ok: boolean }>;
  read: () => PlaybackSample;
  stop: () => void;
  sleep?: (ms: number) => Promise<void>;
}): Promise<string> {
  const ticket = ++playbackTicket;
  const stale = () => ticket !== playbackTicket;
  const sleep =
    deps.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const counts = { ok: 0, fail: 0, silent: 0 };
  const failedIds: string[] = [];

  try {
    for (const entry of deps.entries) {
      for (const audio of entry.audios ?? []) {
        if (stale()) return "";
        deps.stop();
        const outcome = await classifyOnePlayback({
          audioId: audio.id,
          play: () => deps.play(entry.id, audio),
          read: deps.read,
          sleep,
        });
        if (stale()) return "";
        counts[outcome] += 1;
        if (outcome !== "ok") failedIds.push(audio.id);
      }
    }
  } finally {
    if (!stale()) deps.stop();
  }

  return formatPlaybackAudit(counts, failedIds);
}
