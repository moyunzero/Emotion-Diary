/**
 * Unit tests for audio module
 *
 * Tests:
 * - computeEntrySyncStatus function
 * - RecordingState type
 * - AudioState interface
 * - AudioActions interface
 *
 * Requirements: 1.2.2, 6.1.2
 */

import { MoodEntry, SyncStatus, AudioData, Status } from "../../../types";
import { computeEntrySyncStatus } from "../../../store/modules/audio";
import { RecordingState } from "../../../store/modules/audio";

describe("Audio Module", () => {
    describe("computeEntrySyncStatus", () => {
        const createMockEntry = (syncStatus: SyncStatus, audios?: AudioData[]): MoodEntry => ({
            id: "entry-1",
            timestamp: Date.now(),
            moodLevel: 1,
            content: "Test content",
            deadline: "today",
            people: ["Test"],
            triggers: [],
            status: Status.ACTIVE,
            syncStatus,
            audios,
        });

        const createMockAudio = (id: string, syncStatus: SyncStatus): AudioData => ({
            id,
            localUri: `file:///test/${id}.m4a`,
            duration: 10,
            fileSize: 1024,
            fileHash: `hash-${id}`,
            createdAt: Date.now(),
            syncStatus,
        });

        describe("Entry without audios", () => {
            it("should return entry.syncStatus when no audios", () => {
                const entry = createMockEntry("pending");
                expect(computeEntrySyncStatus(entry)).toBe("pending");
            });

            it("should return entry.syncStatus when audios is empty array", () => {
                const entry = createMockEntry("synced", []);
                expect(computeEntrySyncStatus(entry)).toBe("synced");
            });

            it("should return 'pending' if entry.syncStatus is undefined", () => {
                const entry = createMockEntry(undefined as unknown as SyncStatus);
                expect(computeEntrySyncStatus(entry)).toBe("pending");
            });
        });

        describe("Entry with audios", () => {
            it("should return 'synced' when all audios are synced", () => {
                const audios = [
                    createMockAudio("audio-1", "synced"),
                    createMockAudio("audio-2", "synced"),
                ];
                const entry = createMockEntry("synced", audios);

                expect(computeEntrySyncStatus(entry)).toBe("synced");
            });

            it("should return 'pending' when some audios are pending", () => {
                const audios = [
                    createMockAudio("audio-1", "synced"),
                    createMockAudio("audio-2", "pending"),
                ];
                const entry = createMockEntry("pending", audios);

                expect(computeEntrySyncStatus(entry)).toBe("pending");
            });

            it("should return 'failed' when any audio has failed status", () => {
                const audios = [
                    createMockAudio("audio-1", "synced"),
                    createMockAudio("audio-2", "failed"),
                ];
                const entry = createMockEntry("pending", audios);

                expect(computeEntrySyncStatus(entry)).toBe("failed");
            });

            it("should return 'pending' when all audios are pending", () => {
                const audios = [
                    createMockAudio("audio-1", "pending"),
                    createMockAudio("audio-2", "pending"),
                ];
                const entry = createMockEntry("pending", audios);

                expect(computeEntrySyncStatus(entry)).toBe("pending");
            });

            it("should return 'failed' even if entry.syncStatus is synced", () => {
                const audios = [
                    createMockAudio("audio-1", "synced"),
                    createMockAudio("audio-2", "failed"),
                ];
                const entry = createMockEntry("synced", audios);

                expect(computeEntrySyncStatus(entry)).toBe("failed");
            });
        });

        describe("Edge cases", () => {
            it("should handle single audio", () => {
                const audios = [createMockAudio("audio-1", "synced")];
                const entry = createMockEntry("synced", audios);

                expect(computeEntrySyncStatus(entry)).toBe("synced");
            });

            it("should handle many audios with mixed status", () => {
                const audios = [
                    createMockAudio("audio-1", "synced"),
                    createMockAudio("audio-2", "pending"),
                    createMockAudio("audio-3", "synced"),
                    createMockAudio("audio-4", "pending"),
                    createMockAudio("audio-5", "failed"),
                ];
                const entry = createMockEntry("pending", audios);

                expect(computeEntrySyncStatus(entry)).toBe("failed");
            });

            it("should prioritize failed over pending", () => {
                const audios = [
                    createMockAudio("audio-1", "pending"),
                    createMockAudio("audio-2", "failed"),
                    createMockAudio("audio-3", "pending"),
                ];
                const entry = createMockEntry("pending", audios);

                expect(computeEntrySyncStatus(entry)).toBe("failed");
            });
        });
    });

    describe("RecordingState type", () => {
        it("should accept valid recording states", () => {
            const states: RecordingState[] = ["idle", "recording", "processing", "preview"];

            states.forEach((state) => {
                expect(state).toBeDefined();
            });
        });
    });
});
