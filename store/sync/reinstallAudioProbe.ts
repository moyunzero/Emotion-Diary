/**
 * __DEV__ probe: back up one real m4a through syncToCloud, then play it
 * after local files are gone. This is the uninstall → pull path.
 */

import { cacheDirectory, EncodingType, writeAsStringAsync } from "expo-file-system";

import { classifyOnePlayback, type PlaybackSample } from "./audioRepairProbe";
import { REINSTALL_AUDIO_BASE64 } from "./reinstallAudioFixture";
import type { AudioData, MoodEntry } from "../../types";
import { MoodLevel, Status } from "../../types";

export const REINSTALL_ENTRY_ID = "maestro-reinstall-entry";
export const REINSTALL_AUDIO_ID = "maestro-reinstall-audio";

export function buildReinstallEntry(localUri: string, now = Date.now()): MoodEntry {
  const audio: AudioData = {
    id: REINSTALL_AUDIO_ID,
    localUri,
    duration: 1,
    fileSize: 6493,
    fileHash: "reinstall",
    createdAt: now,
    syncStatus: "pending",
  };
  return {
    id: REINSTALL_ENTRY_ID,
    timestamp: now,
    updatedAt: now,
    moodLevel: MoodLevel.ANNOYED,
    content: "maestro reinstall",
    deadline: "today",
    people: [],
    triggers: [],
    status: Status.ACTIVE,
    syncStatus: "pending",
    audios: [audio],
  };
}

async function writeFixtureFile(): Promise<string> {
  const root = cacheDirectory ?? "file:///cache/";
  const uri = `${root}reinstall-tone.m4a`;
  await writeAsStringAsync(uri, REINSTALL_AUDIO_BASE64, {
    encoding: EncodingType.Base64,
  });
  return uri;
}

/**
 * Put one pending clip in the store and run the production backup.
 * Success means the cloud remoteUrl is an object path, not an http URL.
 */
export async function runReinstallBackup(deps: {
  getEntries: () => readonly MoodEntry[];
  setEntries: (entries: MoodEntry[]) => void;
  syncToCloud: () => Promise<boolean>;
}): Promise<string> {
  const localUri = await writeFixtureFile();
  const entry = buildReinstallEntry(localUri);
  const rest = deps.getEntries().filter((item) => item.id !== REINSTALL_ENTRY_ID);
  deps.setEntries([entry, ...rest]);

  const synced = await deps.syncToCloud();
  const saved = deps
    .getEntries()
    .find((item) => item.id === REINSTALL_ENTRY_ID)
    ?.audios?.find((audio) => audio.id === REINSTALL_AUDIO_ID);
  const remoteUrl = saved?.remoteUrl ?? "";
  if (!synced || !remoteUrl || /^https?:\/\//i.test(remoteUrl)) {
    return "backup:fail";
  }
  return "backup:ok";
}

/**
 * Play the restored clip only. Local file is expected to be gone.
 */
export async function runReinstallPlayback(deps: {
  pull: () => Promise<boolean>;
  getEntries: () => readonly { id: string; audios?: readonly AudioData[] }[];
  play: (entryId: string, audio: AudioData) => Promise<{ ok: boolean }>;
  read: () => PlaybackSample;
  stop: () => void;
  sleep?: (ms: number) => Promise<void>;
}): Promise<string> {
  const pulled = await deps.pull();
  if (!pulled) return "reinstall:fail:pull";

  const entry = deps.getEntries().find((item) =>
    item.audios?.some((audio) => audio.id === REINSTALL_AUDIO_ID),
  );
  const audio = entry?.audios?.find((item) => item.id === REINSTALL_AUDIO_ID);
  if (!entry || !audio) {
    return "reinstall:fail:missing";
  }

  const sleep =
    deps.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  try {
    deps.stop();
    const outcome = await classifyOnePlayback({
      audioId: audio.id,
      play: () => deps.play(entry.id, audio),
      read: deps.read,
      sleep,
    });
    return outcome === "ok" ? "reinstall:pass" : `reinstall:fail:${outcome}`;
  } finally {
    deps.stop();
  }
}
