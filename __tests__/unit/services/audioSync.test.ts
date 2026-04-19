/**
 * Unit tests for audio sync service
 *
 * Tests:
 * - uploadAudio function
 * - uploadPendingAudios function
 * - downloadAudio function
 * - deleteCloudAudio function
 * - MAX_RETRY_COUNT constant
 *
 * Requirements: 4.2.1, 4.2.2, 4.2.3
 */

import {
    uploadAudio,
    uploadPendingAudios,
    downloadAudio,
    deleteCloudAudio,
    deleteMultipleCloudAudios,
    getCloudAudioUrl,
    checkCloudAudioExists,
} from "../../../services/audioSync";
import { AudioData, SyncStatus } from "../../../types";

const mockStorageFrom = jest.fn();
const mockIsSupabaseConfigured = jest.fn();

jest.mock("../../../lib/supabase", () => ({
    supabase: {
        storage: {
            from: (...args: unknown[]) => mockStorageFrom(...args),
        },
    },
    isSupabaseConfigured: () => mockIsSupabaseConfigured(),
}));

describe("Audio Sync Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStorageFrom.mockReturnValue({
            upload: jest.fn(),
            download: jest.fn(),
            remove: jest.fn(),
            getPublicUrl: jest.fn(),
        });
    });

    describe("uploadAudio", () => {
        const mockAudioData: AudioData = {
            id: "test-audio-1",
            localUri: "file:///test/audio.m4a",
            duration: 10,
            fileSize: 1024,
            fileHash: "abc123",
            createdAt: Date.now(),
            syncStatus: "pending" as SyncStatus,
        };

        it("should return error when Supabase is not configured", async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await uploadAudio(mockAudioData, "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Supabase 未配置");
        });

        it("should return error when localUri is missing", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            const audioWithoutUri: AudioData = {
                id: "test-audio-1",
                localUri: "",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending" as SyncStatus,
            };

            const result = await uploadAudio(audioWithoutUri, "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("没有本地文件");
        });

        it("should upload successfully and return remoteUrl", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            const mockPublicUrl = "https://example.com/storage/audios/user-123/test-audio-1.m4a";
            mockStorageFrom.mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: "uploaded", error: null }),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: mockPublicUrl } }),
            });

            const result = await uploadAudio(mockAudioData, "user-123");

            expect(result.success).toBe(true);
            expect(result.remoteUrl).toBe(mockPublicUrl);
        });

        it("should return error when upload fails", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                upload: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Upload failed" },
                }),
            });

            const result = await uploadAudio(mockAudioData, "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Upload failed");
        });
    });

    describe("uploadPendingAudios", () => {
        const createMockAudio = (id: string, syncStatus: SyncStatus): AudioData => ({
            id,
            localUri: `file:///test/audio-${id}.m4a`,
            duration: 10,
            fileSize: 1024,
            fileHash: `hash-${id}`,
            createdAt: Date.now(),
            syncStatus,
        });

        it("should filter and upload only pending audios", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            const audios = [
                createMockAudio("audio-1", "pending"),
                createMockAudio("audio-2", "synced"),
                createMockAudio("audio-3", "failed"),
            ];

            mockStorageFrom.mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: "uploaded", error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: `https://example.com/storage/audios/user-123/audio-1.m4a` },
                }),
            });

            const result = await uploadPendingAudios(audios, "user-123");

            expect(result.success).toBe(1);
            expect(result.results.has("audio-1")).toBe(true);
        });

        it("should skip audios without localUri", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            const audios: AudioData[] = [
                {
                    id: "audio-no-uri",
                    localUri: "",
                    duration: 10,
                    fileSize: 1024,
                    fileHash: "hash-no-uri",
                    createdAt: Date.now(),
                    syncStatus: "pending" as SyncStatus,
                },
            ];

            const result = await uploadPendingAudios(audios, "user-123");

            expect(result.success).toBe(0);
            expect(result.failed).toBe(0);
        });
    });

    describe("downloadAudio", () => {
        const mockAudioData: AudioData = {
            id: "test-audio-1",
            localUri: "file:///test/audio.m4a",
            remoteUrl: "https://example.com/storage/audios/user-123/test-audio-1.m4a",
            duration: 10,
            fileSize: 1024,
            fileHash: "abc123",
            createdAt: Date.now(),
            syncStatus: "synced" as SyncStatus,
        };

        it("should return error when Supabase is not configured", async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await downloadAudio(mockAudioData, "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Supabase 未配置");
        });

        it("should return error when remoteUrl is missing", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            const audioWithoutUrl: AudioData = {
                id: "test-audio-1",
                localUri: "file:///test/audio.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "synced" as SyncStatus,
            };

            const result = await downloadAudio(audioWithoutUrl, "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("没有远程URL");
        });

        it("should download successfully", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                download: jest.fn().mockResolvedValue({ data: "file-data", error: null }),
            });

            const result = await downloadAudio(mockAudioData, "user-123");

            expect(result.success).toBe(true);
        });

        it("should return error when download fails", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                download: jest.fn().mockResolvedValue({ data: null, error: { message: "Download failed" } }),
            });

            const result = await downloadAudio(mockAudioData, "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Download failed");
        });
    });

    describe("deleteCloudAudio", () => {
        it("should return error when Supabase is not configured", async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const result = await deleteCloudAudio("audio-123", "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Supabase 未配置");
        });

        it("should delete successfully", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                remove: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await deleteCloudAudio("audio-123", "user-123");

            expect(result.success).toBe(true);
        });

        it("should return error when delete fails", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                remove: jest.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
            });

            const result = await deleteCloudAudio("audio-123", "user-123");

            expect(result.success).toBe(false);
            expect(result.error).toBe("Delete failed");
        });
    });

    describe("deleteMultipleCloudAudios", () => {
        it("should delete multiple audios successfully", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                remove: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await deleteMultipleCloudAudios(
                ["audio-1", "audio-2", "audio-3"],
                "user-123"
            );

            expect(result.success).toBe(3);
            expect(result.failed).toBe(0);
        });

        it("should return all failed when delete fails", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                remove: jest.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
            });

            const result = await deleteMultipleCloudAudios(
                ["audio-1", "audio-2"],
                "user-123"
            );

            expect(result.success).toBe(0);
            expect(result.failed).toBe(2);
        });
    });

    describe("getCloudAudioUrl", () => {
        it("should return null when Supabase is not configured", () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const url = getCloudAudioUrl("audio-123", "user-123");

            expect(url).toBeNull();
        });

        it("should return public URL when configured", () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: "https://example.com/storage/audios/user-123/audio-123.m4a" },
                }),
            });

            const url = getCloudAudioUrl("audio-123", "user-123");

            expect(url).toBe("https://example.com/storage/audios/user-123/audio-123.m4a");
        });
    });

    describe("checkCloudAudioExists", () => {
        it("should return false when Supabase is not configured", async () => {
            mockIsSupabaseConfigured.mockReturnValue(false);

            const exists = await checkCloudAudioExists("audio-123", "user-123");

            expect(exists).toBe(false);
        });

        it("should return true when audio exists", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                download: jest.fn().mockResolvedValue({ data: "file-data", error: null }),
            });

            const exists = await checkCloudAudioExists("audio-123", "user-123");

            expect(exists).toBe(true);
        });

        it("should return false when audio does not exist", async () => {
            mockIsSupabaseConfigured.mockReturnValue(true);

            mockStorageFrom.mockReturnValue({
                download: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
            });

            const exists = await checkCloudAudioExists("audio-123", "user-123");

            expect(exists).toBe(false);
        });
    });
});
