/**
 * Unit tests for audio store slice
 *
 * Tests:
 * - 6.1.3 Recording state machine
 * - 6.1.4 Playback control
 *
 * Requirements: 6.1.3, 6.1.4
 */

import { create, UseBoundStore } from "zustand";
import { AudioData, MoodEntry, Status, SyncStatus } from "../../../types";
import {
    RecordingState,
    AudioState,
    AudioActions,
    createAudioSlice,
    computeEntrySyncStatus,
    getCurrentPlayingAudioId,
    isAudioPlaying,
} from "../../../store/modules/audio";
import { StoreApi } from "zustand";

type AudioStore = UseBoundStore<StoreApi<AudioState & AudioActions>>;

describe("Audio Store - Recording State Machine", () => {
    let store: AudioStore;

    beforeEach(() => {
        store = create<AudioState & AudioActions>((set, get) =>
            createAudioSlice(set as any, get as any, [] as any)
        );
    });

    describe("Initial State", () => {
        it("should have idle recording state initially", () => {
            expect(store.getState().recordingState).toBe("idle");
        });

        it("should have zero recording duration initially", () => {
            expect(store.getState().recordingDuration).toBe(0);
        });

        it("should have null current recording URI initially", () => {
            expect(store.getState().currentRecordingUri).toBeNull();
        });
    });

    describe("startRecording", () => {
        it("should transition to recording state", async () => {
            await store.getState().startRecording();
            expect(store.getState().recordingState).toBe("recording");
        });

        it("should reset recording duration to zero", async () => {
            store.setState({ recordingDuration: 30 });
            await store.getState().startRecording();
            expect(store.getState().recordingDuration).toBe(0);
        });

        it("should reset current recording URI to null", async () => {
            store.setState({ currentRecordingUri: "file:///old-uri.m4a" });
            await store.getState().startRecording();
            expect(store.getState().currentRecordingUri).toBeNull();
        });
    });

    describe("stopRecording", () => {
        beforeEach(() => {
            store.setState({
                recordingState: "recording",
                recordingDuration: 10,
                currentRecordingUri: "file:///test-recording.m4a",
            });
        });

        it("should return null if no recording URI exists", async () => {
            store.setState({ currentRecordingUri: null });
            const result = await store.getState().stopRecording();
            expect(result).toBeNull();
        });

        it("should transition to preview state after successful stop", async () => {
            await store.getState().stopRecording();
            expect(store.getState().recordingState).toBe("preview");
        });

        it("should return AudioData object with correct properties", async () => {
            const result = await store.getState().stopRecording();
            expect(result).not.toBeNull();
            expect(result).toHaveProperty("id");
            expect(result).toHaveProperty("localUri", "file:///test-recording.m4a");
            expect(result).toHaveProperty("duration", 10);
            expect(result).toHaveProperty("syncStatus", "pending");
        });

        it("should clear recording URI after stop", async () => {
            await store.getState().stopRecording();
            expect(store.getState().currentRecordingUri).toBeNull();
        });

        it("should reset recording duration after stop", async () => {
            await store.getState().stopRecording();
            expect(store.getState().recordingDuration).toBe(0);
        });

        it("should set idle state if no URI", async () => {
            store.setState({ currentRecordingUri: null });
            await store.getState().stopRecording();
            expect(store.getState().recordingState).toBe("idle");
        });
    });

    describe("cancelRecording", () => {
        beforeEach(() => {
            store.setState({
                recordingState: "recording",
                recordingDuration: 10,
                currentRecordingUri: "file:///test-recording.m4a",
            });
        });

        it("should transition back to idle state", () => {
            store.getState().cancelRecording();
            expect(store.getState().recordingState).toBe("idle");
        });

        it("should reset recording duration to zero", () => {
            store.getState().cancelRecording();
            expect(store.getState().recordingDuration).toBe(0);
        });

        it("should clear current recording URI", () => {
            store.getState().cancelRecording();
            expect(store.getState().currentRecordingUri).toBeNull();
        });
    });

    describe("setRecordingState", () => {
        it("should accept all valid recording states", () => {
            const validStates: RecordingState[] = ["idle", "recording", "canceling", "processing", "preview"];

            validStates.forEach((state) => {
                store.getState().setRecordingState(state);
                expect(store.getState().recordingState).toBe(state);
            });
        });
    });

    describe("setRecordingDuration", () => {
        it("should update recording duration", () => {
            store.getState().setRecordingDuration(30);
            expect(store.getState().recordingDuration).toBe(30);
        });

        it("should accept zero duration", () => {
            store.getState().setRecordingDuration(0);
            expect(store.getState().recordingDuration).toBe(0);
        });
    });

    describe("setCurrentRecordingUri", () => {
        it("should update current recording URI", () => {
            store.getState().setCurrentRecordingUri("file:///new-uri.m4a");
            expect(store.getState().currentRecordingUri).toBe("file:///new-uri.m4a");
        });

        it("should accept null to clear URI", () => {
            store.setState({ currentRecordingUri: "file:///old-uri.m4a" });
            store.getState().setCurrentRecordingUri(null);
            expect(store.getState().currentRecordingUri).toBeNull();
        });
    });
});

describe("Audio Store - Playback Control", () => {
    let store: AudioStore;

    beforeEach(() => {
        store = create<AudioState & AudioActions>((set, get) =>
            createAudioSlice(set as any, get as any, [] as any)
        );
    });

    describe("Initial Playback State", () => {
        it("should have null current audio ID initially", () => {
            expect(store.getState().currentAudioId).toBeNull();
        });

        it("should not be playing initially", () => {
            expect(store.getState().isPlaying).toBe(false);
        });

        it("should have zero playback position initially", () => {
            expect(store.getState().playbackPosition).toBe(0);
        });

        it("should have zero duration initially", () => {
            expect(store.getState().duration).toBe(0);
        });
    });

    describe("playAudio", () => {
        it("should set current audio ID", () => {
            store.getState().playAudio("audio-123", "file:///test.m4a");
            expect(store.getState().currentAudioId).toBe("audio-123");
        });

        it("should set isPlaying to true", () => {
            store.getState().playAudio("audio-123", "file:///test.m4a");
            expect(store.getState().isPlaying).toBe(true);
        });

        it("should preserve existing playback position when starting new playback", () => {
            store.setState({ playbackPosition: 50 });
            store.getState().playAudio("audio-456", "file:///test.m4a");
            expect(store.getState().playbackPosition).toBe(50);
        });
    });

    describe("pauseAudio", () => {
        beforeEach(() => {
            store.setState({
                currentAudioId: "audio-123",
                isPlaying: true,
            });
        });

        it("should set isPlaying to false", () => {
            store.getState().pauseAudio();
            expect(store.getState().isPlaying).toBe(false);
        });

        it("should preserve current audio ID", () => {
            store.getState().pauseAudio();
            expect(store.getState().currentAudioId).toBe("audio-123");
        });

        it("should preserve playback position", () => {
            store.setState({ playbackPosition: 30 });
            store.getState().pauseAudio();
            expect(store.getState().playbackPosition).toBe(30);
        });
    });

    describe("stopAudio", () => {
        beforeEach(() => {
            store.setState({
                currentAudioId: "audio-123",
                isPlaying: true,
                playbackPosition: 45,
            });
        });

        it("should set current audio ID to null", () => {
            store.getState().stopAudio();
            expect(store.getState().currentAudioId).toBeNull();
        });

        it("should set isPlaying to false", () => {
            store.getState().stopAudio();
            expect(store.getState().isPlaying).toBe(false);
        });

        it("should reset playback position to zero", () => {
            store.getState().stopAudio();
            expect(store.getState().playbackPosition).toBe(0);
        });
    });

    describe("seekTo", () => {
        it("should update playback position", () => {
            store.getState().seekTo(60);
            expect(store.getState().playbackPosition).toBe(60);
        });

        it("should accept zero position", () => {
            store.getState().seekTo(0);
            expect(store.getState().playbackPosition).toBe(0);
        });

        it("should accept large position values", () => {
            store.getState().seekTo(300);
            expect(store.getState().playbackPosition).toBe(300);
        });
    });

    describe("setPlaybackPosition", () => {
        it("should update playback position", () => {
            store.getState().setPlaybackPosition(45);
            expect(store.getState().playbackPosition).toBe(45);
        });
    });

    describe("getCurrentPlayingAudioId helper", () => {
        it("should return null when no audio is playing", () => {
            store.setState({ currentAudioId: null });
            expect(getCurrentPlayingAudioId(store.getState() as any)).toBeNull();
        });

        it("should return audio ID when audio is playing", () => {
            store.setState({ currentAudioId: "audio-123" });
            expect(getCurrentPlayingAudioId(store.getState() as any)).toBe("audio-123");
        });
    });

    describe("isAudioPlaying helper", () => {
        it("should return false when no audio ID is set", () => {
            store.setState({ currentAudioId: null, isPlaying: false });
            expect(isAudioPlaying(store.getState() as any)).toBe(false);
        });

        it("should return false when paused (isPlaying is false)", () => {
            store.setState({ currentAudioId: "audio-123", isPlaying: false });
            expect(isAudioPlaying(store.getState() as any)).toBe(false);
        });

        it("should return true when audio is playing", () => {
            store.setState({ currentAudioId: "audio-123", isPlaying: true });
            expect(isAudioPlaying(store.getState() as any)).toBe(true);
        });
    });
});

describe("Audio Store - computeEntrySyncStatus", () => {
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

    it("should return entry.syncStatus when no audios", () => {
        const entry = createMockEntry("pending");
        expect(computeEntrySyncStatus(entry)).toBe("pending");
    });

    it("should return 'synced' when all audios are synced", () => {
        const entry = createMockEntry("synced", [
            createMockAudio("a1", "synced"),
            createMockAudio("a2", "synced"),
        ]);
        expect(computeEntrySyncStatus(entry)).toBe("synced");
    });

    it("should return 'pending' when some audios are pending", () => {
        const entry = createMockEntry("pending", [
            createMockAudio("a1", "synced"),
            createMockAudio("a2", "pending"),
        ]);
        expect(computeEntrySyncStatus(entry)).toBe("pending");
    });

    it("should return 'failed' when any audio has failed status", () => {
        const entry = createMockEntry("pending", [
            createMockAudio("a1", "synced"),
            createMockAudio("a2", "failed"),
        ]);
        expect(computeEntrySyncStatus(entry)).toBe("failed");
    });
});
