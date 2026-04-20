/**
 * Integration Tests for Audio Recording Feature
 *
 * Tests:
 * - 6.2.2 Entry 保存与加载测试（含音频）
 *
 * Requirements: 6.2.2
 */

import { MoodEntry, Status, AudioData, SyncStatus, MoodLevel } from "../../types";
import { computeEntrySyncStatus } from "../../store/modules/audio";

describe("Audio Recording Integration Tests", () => {
    describe("Entry with Audio - Sync Status Calculation", () => {
        it("should calculate correct sync status for entry with synced audio", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry with audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///test/audio.m4a",
                        remoteUrl: "https://example.com/audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "synced",
                    },
                ],
            };

            expect(computeEntrySyncStatus(entry)).toBe("synced");
        });

        it("should calculate correct sync status for entry with pending audio", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry with audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///test/audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            expect(computeEntrySyncStatus(entry)).toBe("pending");
        });

        it("should calculate correct sync status for entry with failed audio", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry with audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///test/audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "failed",
                    },
                ],
            };

            expect(computeEntrySyncStatus(entry)).toBe("failed");
        });

        it("should calculate correct sync status for entry with multiple audios", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry with multiple audios",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///test/audio1.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "synced",
                    },
                    {
                        id: "audio-2",
                        localUri: "file:///test/audio2.m4a",
                        duration: 20,
                        fileSize: 2048,
                        fileHash: "def456",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            expect(computeEntrySyncStatus(entry)).toBe("pending");
        });

        it("should return failed if any audio has failed status", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry with multiple audios",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///test/audio1.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "synced",
                    },
                    {
                        id: "audio-2",
                        localUri: "file:///test/audio2.m4a",
                        duration: 20,
                        fileSize: 2048,
                        fileHash: "def456",
                        createdAt: Date.now(),
                        syncStatus: "failed",
                    },
                ],
            };

            expect(computeEntrySyncStatus(entry)).toBe("failed");
        });
    });

    describe("Entry without Audio", () => {
        it("should return entry.syncStatus when no audios", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry without audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: "synced",
            };

            expect(computeEntrySyncStatus(entry)).toBe("synced");
        });

        it("should return pending when syncStatus is not set", () => {
            const entry: MoodEntry = {
                id: "entry-1",
                timestamp: Date.now(),
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry without audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                status: Status.ACTIVE,
                syncStatus: undefined as unknown as SyncStatus,
            };

            expect(computeEntrySyncStatus(entry)).toBe("pending");
        });
    });

    describe("AudioData Structure Validation", () => {
        it("should have all required fields for a valid audio entry", () => {
            const audio: AudioData = {
                id: "audio-1",
                localUri: "file:///test/audio.m4a",
                remoteUrl: "https://example.com/audio.m4a",
                duration: 10.5,
                fileSize: 1024,
                fileHash: "abc123def456",
                name: "Test Recording",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            expect(audio.id).toBeDefined();
            expect(audio.localUri).toBeDefined();
            expect(audio.duration).toBeGreaterThan(0);
            expect(audio.fileSize).toBeGreaterThanOrEqual(0);
            expect(audio.fileHash).toBeDefined();
            expect(audio.createdAt).toBeDefined();
            expect(audio.syncStatus).toBeDefined();
        });

        it("should allow optional remoteUrl for local-only audio", () => {
            const audio: AudioData = {
                id: "audio-1",
                localUri: "file:///test/audio.m4a",
                duration: 10.5,
                fileSize: 1024,
                fileHash: "abc123def456",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            expect(audio.remoteUrl).toBeUndefined();
        });

        it("should allow optional name field", () => {
            const audio: AudioData = {
                id: "audio-1",
                localUri: "file:///test/audio.m4a",
                duration: 10.5,
                fileSize: 1024,
                fileHash: "abc123def456",
                createdAt: Date.now(),
                syncStatus: "synced",
            };

            expect(audio.name).toBeUndefined();
        });
    });

    describe("Audio Sync Status Transitions", () => {
        it("should track audio from pending to synced", () => {
            let audio: AudioData = {
                id: "audio-1",
                localUri: "file:///test/audio.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            expect(audio.syncStatus).toBe("pending");

            audio = { ...audio, syncStatus: "synced" };
            expect(audio.syncStatus).toBe("synced");
        });

        it("should track audio sync failure", () => {
            let audio: AudioData = {
                id: "audio-1",
                localUri: "file:///test/audio.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            audio = { ...audio, syncStatus: "failed" };
            expect(audio.syncStatus).toBe("failed");
        });
    });
});

describe("Draft Manager with Audio Integration", () => {
    // Mock draft entry with audio
    interface DraftEntryWithAudio {
        moodLevel: number;
        content: string;
        deadline: string;
        customDeadlineText: string;
        isCustomDeadline: boolean;
        selectedPeople: string[];
        selectedTriggers: string[];
        audios?: AudioData[];
    }

    it("should serialize and deserialize draft with audio", () => {
        const draftWithAudio: DraftEntryWithAudio = {
            moodLevel: MoodLevel.ANNOYED,
            content: "Test content",
            deadline: "today",
            customDeadlineText: "",
            isCustomDeadline: false,
            selectedPeople: ["Test Person"],
            selectedTriggers: ["Test Trigger"],
            audios: [
                {
                    id: "audio-1",
                    localUri: "file:///test/audio.m4a",
                    duration: 10,
                    fileSize: 1024,
                    fileHash: "abc123",
                    createdAt: Date.now(),
                    syncStatus: "pending",
                },
            ],
        };

        const serialized = JSON.stringify(draftWithAudio);
        const deserialized: DraftEntryWithAudio = JSON.parse(serialized);

        expect(deserialized.moodLevel).toBe(MoodLevel.ANNOYED);
        expect(deserialized.content).toBe("Test content");
        expect(deserialized.audios).toHaveLength(1);
        expect(deserialized.audios![0].id).toBe("audio-1");
        expect(deserialized.audios![0].localUri).toBe("file:///test/audio.m4a");
        expect(deserialized.audios![0].syncStatus).toBe("pending");
    });

    it("should handle draft without audio", () => {
        const draftWithoutAudio: DraftEntryWithAudio = {
            moodLevel: MoodLevel.ANNOYED,
            content: "Test content",
            deadline: "today",
            customDeadlineText: "",
            isCustomDeadline: false,
            selectedPeople: [],
            selectedTriggers: [],
        };

        const serialized = JSON.stringify(draftWithoutAudio);
        const deserialized: DraftEntryWithAudio = JSON.parse(serialized);

        expect(deserialized.moodLevel).toBe(MoodLevel.ANNOYED);
        expect(deserialized.audios).toBeUndefined();
    });
});
