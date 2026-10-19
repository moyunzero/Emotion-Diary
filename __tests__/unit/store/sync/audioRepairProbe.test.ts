/**
 * Repair boundary line and playback classification.
 * File-system outcomes are stubbed; Maestro runs the same report on device.
 */

const mockGetInfoAsync = jest.fn();

jest.mock("expo-file-system", () => ({
  EncodingType: { Base64: "base64" },
  cacheDirectory: "file:///cache/",
  writeAsStringAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
}));

jest.mock("../../../../lib/supabase", () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: { storage: { from: () => ({}) } },
}));

import {
  auditStorePlayback,
  classifyOnePlayback,
  formatPlaybackAudit,
  runRepairBoundaryReport,
} from "../../../../store/sync/audioRepairProbe";

const REPAIR_LINE =
  "repair:synced-https-missing=skip-missing|synced-https-empty=skip-missing|synced-object-path=skip|synced-file-url=skip|synced-spaced-https=skip|synced-no-remote=skip|uppercase-http=upload|pending-file=upload|failed-file=upload|pending-null-remote=upload|pending-missing=fail-missing|failed-empty=fail-missing|pending-unicode-missing=fail-missing|no-local=skip";

beforeEach(() => {
  mockGetInfoAsync.mockImplementation(async (uri: string) => {
    if (String(uri).includes("repair-bytes")) return { exists: true, size: 5 };
    if (String(uri).includes("repair-empty")) return { exists: true, size: 0 };
    return { exists: false, size: 0 };
  });
});

describe("runRepairBoundaryReport", () => {
  it("locks the re-upload decisions Maestro asserts", async () => {
    await expect(runRepairBoundaryReport()).resolves.toBe(REPAIR_LINE);
  });
});

describe("classifyOnePlayback", () => {
  const sleep = async () => undefined;

  it("fails when play cannot resolve a uri", async () => {
    const read = jest.fn();
    await expect(
      classifyOnePlayback({
        audioId: "a",
        play: async () => ({ ok: false }),
        read,
        sleep,
      }),
    ).resolves.toBe("fail");
    expect(read).not.toHaveBeenCalled();
  });

  it("fails when play throws", async () => {
    await expect(
      classifyOnePlayback({
        audioId: "a",
        play: async () => {
          throw new Error("native");
        },
        read: () => ({ playbackPosition: 1, currentAudioId: "a" }),
        sleep,
      }),
    ).resolves.toBe("fail");
  });

  it("passes when the playhead moves", async () => {
    await expect(
      classifyOnePlayback({
        audioId: "a",
        play: async () => ({ ok: true }),
        read: () => ({ playbackPosition: 0.2, currentAudioId: "a" }),
        sleep,
      }),
    ).resolves.toBe("ok");
  });

  it("passes when a short clip finishes before the playhead is sampled", async () => {
    await expect(
      classifyOnePlayback({
        audioId: "a",
        play: async () => ({ ok: true }),
        read: () => ({ playbackPosition: 0, currentAudioId: null }),
        sleep,
      }),
    ).resolves.toBe("ok");
  });

  it("stays silent when play reports success but the playhead never moves", async () => {
    await expect(
      classifyOnePlayback({
        audioId: "a",
        play: async () => ({ ok: true }),
        read: () => ({ playbackPosition: 0, currentAudioId: "a" }),
        sleep,
      }),
    ).resolves.toBe("silent");
  });
});

describe("auditStorePlayback", () => {
  const clip = (id: string) => ({
    id,
    localUri: `file:///${id}.m4a`,
    duration: 1,
    fileSize: 1,
    fileHash: "h",
    createdAt: 1,
    syncStatus: "synced" as const,
  });

  it("counts heard, missing, and silent clips", async () => {
    let currentId: string | null = null;
    const line = await auditStorePlayback({
      entries: [{ id: "e1", audios: [clip("heard"), clip("missing"), clip("stuck")] }],
      play: async (_entryId, audio) => {
        if (audio.id === "missing") return { ok: false };
        currentId = audio.id;
        return { ok: true };
      },
      read: () => ({
        playbackPosition: currentId === "heard" ? 0.4 : 0,
        currentAudioId: currentId,
      }),
      stop: () => {
        currentId = null;
      },
      sleep: async () => undefined,
    });

    expect(line).toBe(
      "playback:fail:ok=1:fail=1:silent=1:total=3:ids=missing,stuck",
    );
  });
});

describe("formatPlaybackAudit", () => {
  it("fails a zero-clip audit", () => {
    expect(formatPlaybackAudit({ ok: 0, fail: 0, silent: 0 }, [])).toBe(
      "playback:fail:ok=0:fail=0:silent=0:total=0",
    );
  });

  it('passes when a clip was heard and none stayed silent', () => {
    expect(formatPlaybackAudit({ ok: 2, fail: 0, silent: 0 }, [])).toBe(
      "playback:pass:ok=2:fail=0:silent=0:total=2",
    );
    expect(formatPlaybackAudit({ ok: 1, fail: 54, silent: 0 }, [])).toBe(
      "playback:pass:ok=1:fail=54:silent=0:total=55",
    );
    expect(formatPlaybackAudit({ ok: 1, fail: 0, silent: 1 }, ["stuck"])).toBe(
      "playback:fail:ok=1:fail=0:silent=1:total=2:ids=stuck",
    );
  });
});
