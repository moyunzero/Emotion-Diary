/**
 * Integration tests for audio sync offline scenarios
 *
 * Tests:
 * - 6.2.3 同步测试（离线上传、下载）
 *
 * Requirements: 6.2.3
 */

import { AudioData, SyncStatus, MoodEntry, Status, MoodLevel } from "../../types";
import { computeEntrySyncStatus } from "../../store/modules/audio";

describe("Audio Sync - Offline Scenarios", () => {
    describe("Offline Upload Scenarios", () => {
        it("should mark audio as pending when created offline", () => {
            const offlineAudio: AudioData = {
                id: "audio-offline-1",
                localUri: "file:///test/audio.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            expect(offlineAudio.syncStatus).toBe("pending");
            expect(offlineAudio.localUri).toBeDefined();
            expect(offlineAudio.remoteUrl).toBeUndefined();
        });

        it("should preserve audio data structure when offline", () => {
            const offlineEntry: MoodEntry = {
                id: "entry-offline-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Offline recorded entry",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///test/audio1.m4a",
                        duration: 15,
                        fileSize: 2048,
                        fileHash: "hash1",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                    {
                        id: "audio-2",
                        localUri: "file:///test/audio2.m4a",
                        duration: 20,
                        fileSize: 3072,
                        fileHash: "hash2",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            expect(offlineEntry.audios).toHaveLength(2);
            expect(offlineEntry.audios!.every((a) => a.syncStatus === "pending")).toBe(true);
            expect(computeEntrySyncStatus(offlineEntry)).toBe("pending");
        });

        it("should handle mixed online and pending audios in entry", () => {
            const mixedEntry: MoodEntry = {
                id: "entry-mixed-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.UPSET,
                content: "Mixed sync status entry",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: [
                    {
                        id: "audio-synced",
                        localUri: "file:///test/audio1.m4a",
                        remoteUrl: "https://example.com/audio1.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "hash1",
                        createdAt: Date.now(),
                        syncStatus: "synced",
                    },
                    {
                        id: "audio-pending",
                        localUri: "file:///test/audio2.m4a",
                        duration: 20,
                        fileSize: 2048,
                        fileHash: "hash2",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            expect(computeEntrySyncStatus(mixedEntry)).toBe("pending");
        });

        it("should handle failed audio in offline scenario", () => {
            const failedAudioEntry: MoodEntry = {
                id: "entry-failed-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANGRY,
                content: "Entry with failed audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    {
                        id: "audio-failed",
                        localUri: "file:///test/audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "failed",
                    },
                ],
            };

            expect(computeEntrySyncStatus(failedAudioEntry)).toBe("failed");
        });
    });

    describe("Offline Download Scenarios", () => {
        it("should handle entry with only remoteUrl (downloaded audio)", () => {
            const downloadedEntry: MoodEntry = {
                id: "entry-downloaded-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Entry with downloaded audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    {
                        id: "audio-downloaded",
                        localUri: "file:///downloaded/audio.m4a",
                        remoteUrl: "https://example.com/remote/audio.m4a",
                        duration: 30,
                        fileSize: 4096,
                        fileHash: "xyz789",
                        createdAt: Date.now(),
                        syncStatus: "synced",
                    },
                ],
            };

            expect(downloadedEntry.audios![0].localUri).toBeDefined();
            expect(downloadedEntry.audios![0].remoteUrl).toBeDefined();
            expect(computeEntrySyncStatus(downloadedEntry)).toBe("synced");
        });

        it("should handle entry with only remoteUrl (not yet downloaded)", () => {
            const remoteOnlyEntry: MoodEntry = {
                id: "entry-remote-only",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Entry with remote-only audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    {
                        id: "audio-remote",
                        localUri: "",
                        remoteUrl: "https://example.com/remote/audio.m4a",
                        duration: 30,
                        fileSize: 4096,
                        fileHash: "xyz789",
                        createdAt: Date.now(),
                        syncStatus: "synced",
                    },
                ],
            };

            expect(remoteOnlyEntry.audios![0].localUri).toBe("");
            expect(remoteOnlyEntry.audios![0].remoteUrl).toBeDefined();
            expect(computeEntrySyncStatus(remoteOnlyEntry)).toBe("synced");
        });

        it("should update localUri after downloading remote audio", () => {
            let audio: AudioData = {
                id: "audio-to-download",
                localUri: "",
                remoteUrl: "https://example.com/remote/audio.m4a",
                duration: 30,
                fileSize: 4096,
                fileHash: "xyz789",
                createdAt: Date.now(),
                syncStatus: "synced",
            };

            expect(audio.localUri).toBe("");

            audio = {
                ...audio,
                localUri: "file:///downloaded/audio.m4a",
            };

            expect(audio.localUri).toBe("file:///downloaded/audio.m4a");
            expect(audio.remoteUrl).toBe("https://example.com/remote/audio.m4a");
        });
    });

    describe("Network Recovery Scenarios", () => {
        it("should transition audio from pending to synced after successful upload", () => {
            let audio: AudioData = {
                id: "audio-upload-1",
                localUri: "file:///test/audio.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            expect(audio.syncStatus).toBe("pending");

            audio = {
                ...audio,
                remoteUrl: "https://example.com/uploaded/audio.m4a",
                syncStatus: "synced",
            };

            expect(audio.syncStatus).toBe("synced");
            expect(audio.remoteUrl).toBeDefined();
        });

        it("should transition audio from pending to failed after upload failure", () => {
            let audio: AudioData = {
                id: "audio-upload-fail",
                localUri: "file:///test/audio.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            expect(audio.syncStatus).toBe("pending");

            audio = {
                ...audio,
                syncStatus: "failed",
            };

            expect(audio.syncStatus).toBe("failed");
        });

        it("should handle entry sync status after batch upload", () => {
            const pendingEntry: MoodEntry = {
                id: "entry-batch-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Batch upload entry",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: [
                    {
                        id: "audio-batch-1",
                        localUri: "file:///test/audio1.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "hash1",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                    {
                        id: "audio-batch-2",
                        localUri: "file:///test/audio2.m4a",
                        duration: 20,
                        fileSize: 2048,
                        fileHash: "hash2",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            expect(computeEntrySyncStatus(pendingEntry)).toBe("pending");

            const updatedAudios = pendingEntry.audios!.map((a) => ({
                ...a,
                syncStatus: "synced" as SyncStatus,
                remoteUrl: `https://example.com/${a.id}.m4a`,
            }));

            const syncedEntry: MoodEntry = {
                ...pendingEntry,
                audios: updatedAudios,
            };

            expect(computeEntrySyncStatus(syncedEntry)).toBe("synced");
        });

        it("should handle partial batch upload failure", () => {
            const pendingEntry: MoodEntry = {
                id: "entry-partial-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Partial upload entry",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: [
                    {
                        id: "audio-partial-1",
                        localUri: "file:///test/audio1.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "hash1",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                    {
                        id: "audio-partial-2",
                        localUri: "file:///test/audio2.m4a",
                        duration: 20,
                        fileSize: 2048,
                        fileHash: "hash2",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            const updatedAudios = pendingEntry.audios!.map((a, index) => ({
                ...a,
                syncStatus: index === 0 ? ("synced" as SyncStatus) : ("failed" as SyncStatus),
                remoteUrl: index === 0 ? `https://example.com/${a.id}.m4a` : undefined,
            }));

            const partialEntry: MoodEntry = {
                ...pendingEntry,
                audios: updatedAudios,
            };

            expect(computeEntrySyncStatus(partialEntry)).toBe("failed");
        });
    });

    describe("Sync Status Computation Edge Cases", () => {
        it("should handle empty audios array", () => {
            const entry: MoodEntry = {
                id: "entry-empty",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Entry without audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [],
            };

            expect(computeEntrySyncStatus(entry)).toBe("synced");
        });

        it("should handle undefined audios", () => {
            const entry: MoodEntry = {
                id: "entry-undefined",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Entry with undefined audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
            };

            expect(computeEntrySyncStatus(entry)).toBe("pending");
        });

        it("should prioritize failed over synced when mixing", () => {
            const entry: MoodEntry = {
                id: "entry-mixed-status",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Mixed status entry",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    { id: "a1", localUri: "file:///a1.m4a", duration: 10, fileSize: 1024, fileHash: "h1", createdAt: Date.now(), syncStatus: "synced" },
                    { id: "a2", localUri: "file:///a2.m4a", duration: 10, fileSize: 1024, fileHash: "h2", createdAt: Date.now(), syncStatus: "synced" },
                    { id: "a3", localUri: "file:///a3.m4a", duration: 10, fileSize: 1024, fileHash: "h3", createdAt: Date.now(), syncStatus: "failed" },
                    { id: "a4", localUri: "file:///a4.m4a", duration: 10, fileSize: 1024, fileHash: "h4", createdAt: Date.now(), syncStatus: "synced" },
                ],
            };

            expect(computeEntrySyncStatus(entry)).toBe("failed");
        });

        it("should handle single audio entry", () => {
            const singleAudioEntry: MoodEntry = {
                id: "entry-single",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Single audio entry",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    { id: "a1", localUri: "file:///a1.m4a", duration: 10, fileSize: 1024, fileHash: "h1", createdAt: Date.now(), syncStatus: "synced" },
                ],
            };

            expect(computeEntrySyncStatus(singleAudioEntry)).toBe("synced");
        });
    });
});
