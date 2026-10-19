jest.mock("expo-file-system", () => ({
  EncodingType: { Base64: "base64" },
  cacheDirectory: "file:///cache/",
  writeAsStringAsync: jest.fn(),
}));

jest.mock("../../../../lib/supabase", () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: { storage: { from: () => ({}) } },
}));

import {
  buildReinstallEntry,
  REINSTALL_AUDIO_ID,
  REINSTALL_ENTRY_ID,
  runReinstallPlayback,
} from "../../../../store/sync/reinstallAudioProbe";

describe("reinstall audio probe", () => {
  it("builds a pending clip the production backup will upload", () => {
    const entry = buildReinstallEntry("file:///cache/reinstall-tone.m4a", 10);
    expect(entry.id).toBe(REINSTALL_ENTRY_ID);
    expect(entry.audios?.[0]).toMatchObject({
      id: REINSTALL_AUDIO_ID,
      localUri: "file:///cache/reinstall-tone.m4a",
      syncStatus: "pending",
    });
    expect(entry.audios?.[0].remoteUrl).toBeUndefined();
  });

  it("passes only when the restored clip is heard", async () => {
    const audio = buildReinstallEntry("file:///gone.m4a").audios![0];
    await expect(
      runReinstallPlayback({
        pull: async () => true,
        getEntries: () => [],
        play: async () => ({ ok: true }),
        read: () => ({ playbackPosition: 0, currentAudioId: null }),
        stop: () => undefined,
        sleep: async () => undefined,
      }),
    ).resolves.toBe("reinstall:fail:missing");

    await expect(
      runReinstallPlayback({
        pull: async () => true,
        getEntries: () => [{ id: REINSTALL_ENTRY_ID, audios: [audio] }],
        play: async () => ({ ok: true }),
        read: () => ({ playbackPosition: 0.4, currentAudioId: audio.id }),
        stop: () => undefined,
        sleep: async () => undefined,
      }),
    ).resolves.toBe("reinstall:pass");
  });
});
