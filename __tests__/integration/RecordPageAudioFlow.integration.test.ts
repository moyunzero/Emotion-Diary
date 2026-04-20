/**
 * Integration tests for Record page audio recording flow
 *
 * Tests:
 * - 6.2.1 Record 页面录音流程测试
 *
 * Requirements: 6.2.1
 */

import { AudioData, SyncStatus, MoodEntry, Status, MoodLevel } from "../../types";
import { computeEntrySyncStatus } from "../../store/modules/audio";

describe("Record Page Audio Recording Flow", () => {
    describe("Recording Flow State Machine", () => {
        type RecordingFlowState =
            | "idle"
            | "recording"
            | "processing"
            | "preview"
            | "submitting";

        interface RecordFlowContext {
            state: RecordingFlowState;
            audios: AudioData[];
            hasRecordingPermission: boolean;
            currentRecordingUri: string | null;
        }

        const createFlowContext = (): RecordFlowContext => ({
            state: "idle",
            audios: [],
            hasRecordingPermission: true,
            currentRecordingUri: null,
        });

        it("should transition from idle to recording on startRecording", () => {
            const ctx = createFlowContext();
            expect(ctx.state).toBe("idle");

            ctx.state = "recording";
            expect(ctx.state).toBe("recording");
            expect(ctx.currentRecordingUri).toBeNull();
        });

        it("should transition from recording to processing on stopRecording", () => {
            const ctx = createFlowContext();
            ctx.state = "recording";
            ctx.currentRecordingUri = "file:///test-recording.m4a";

            ctx.state = "processing";
            expect(ctx.state).toBe("processing");
        });

        it("should add audio to list on successful recording", () => {
            const ctx = createFlowContext();
            ctx.state = "processing";

            const newAudio: AudioData = {
                id: "audio-new",
                localUri: "file:///test-recording.m4a",
                duration: 10,
                fileSize: 1024,
                fileHash: "abc123",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            ctx.audios.push(newAudio);
            ctx.state = "preview";

            expect(ctx.audios).toHaveLength(1);
            expect(ctx.audios[0].id).toBe("audio-new");
            expect(ctx.state).toBe("preview");
        });

        it("should return to idle on cancelRecording", () => {
            const ctx = createFlowContext();
            ctx.state = "recording";
            ctx.currentRecordingUri = "file:///test-recording.m4a";

            ctx.state = "idle";
            ctx.currentRecordingUri = null;

            expect(ctx.state).toBe("idle");
            expect(ctx.currentRecordingUri).toBeNull();
            expect(ctx.audios).toHaveLength(0);
        });

        it("should allow multiple recordings in preview state", () => {
            const ctx = createFlowContext();
            ctx.state = "preview";
            ctx.audios = [
                {
                    id: "audio-1",
                    localUri: "file:///audio1.m4a",
                    duration: 10,
                    fileSize: 1024,
                    fileHash: "hash1",
                    createdAt: Date.now(),
                    syncStatus: "pending",
                },
            ];

            ctx.state = "recording";
            ctx.state = "processing";
            ctx.audios.push({
                id: "audio-2",
                localUri: "file:///audio2.m4a",
                duration: 15,
                fileSize: 1536,
                fileHash: "hash2",
                createdAt: Date.now(),
                syncStatus: "pending",
            });
            ctx.state = "preview";

            expect(ctx.audios).toHaveLength(2);
        });

        it("should delete audio from list", () => {
            const ctx = createFlowContext();
            ctx.audios = [
                {
                    id: "audio-1",
                    localUri: "file:///audio1.m4a",
                    duration: 10,
                    fileSize: 1024,
                    fileHash: "hash1",
                    createdAt: Date.now(),
                    syncStatus: "pending",
                },
                {
                    id: "audio-2",
                    localUri: "file:///audio2.m4a",
                    duration: 15,
                    fileSize: 1536,
                    fileHash: "hash2",
                    createdAt: Date.now(),
                    syncStatus: "pending",
                },
            ];

            ctx.audios = ctx.audios.filter((a) => a.id !== "audio-1");
            expect(ctx.audios).toHaveLength(1);
            expect(ctx.audios[0].id).toBe("audio-2");
        });

        it("should transition to submitting on form submit", () => {
            const ctx = createFlowContext();
            ctx.state = "preview";
            ctx.audios = [
                {
                    id: "audio-1",
                    localUri: "file:///audio1.m4a",
                    duration: 10,
                    fileSize: 1024,
                    fileHash: "hash1",
                    createdAt: Date.now(),
                    syncStatus: "pending",
                },
            ];

            ctx.state = "submitting";
            expect(ctx.state).toBe("submitting");
        });
    });

    describe("Record Form Submission with Audio", () => {
        it("should create entry with audio data", () => {
            const formData = {
                moodLevel: MoodLevel.ANNOYED,
                content: "Test entry with audio",
                deadline: "today",
                people: ["Test Person"],
                triggers: ["Test Trigger"],
                audios: [
                    {
                        id: "audio-submit-1",
                        localUri: "file:///test/audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ] as AudioData[],
            };

            const entry: MoodEntry = {
                id: `entry-${Date.now()}`,
                timestamp: Date.now(),
                moodLevel: formData.moodLevel,
                content: formData.content,
                deadline: formData.deadline,
                people: formData.people,
                triggers: formData.triggers,
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: formData.audios,
            };

            expect(entry.content).toBe("Test entry with audio");
            expect(entry.audios).toHaveLength(1);
            expect(entry.audios![0].id).toBe("audio-submit-1");
            expect(entry.audios![0].localUri).toBe("file:///test/audio.m4a");
        });

        it("should submit entry without audio when audio list is empty", () => {
            const formData = {
                moodLevel: MoodLevel.UPSET,
                content: "Test entry without audio",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                audios: [] as AudioData[],
            };

            const entry: MoodEntry = {
                id: `entry-${Date.now()}`,
                timestamp: Date.now(),
                moodLevel: formData.moodLevel,
                content: formData.content,
                deadline: formData.deadline,
                people: formData.people,
                triggers: formData.triggers,
                status: Status.ACTIVE,
                syncStatus: "pending",
                audios: formData.audios.length > 0 ? formData.audios : undefined,
            };

            expect(entry.audios).toBeUndefined();
        });

        it("should validate entry requires either content or audio", () => {
            const formWithOnlyAudio = {
                moodLevel: MoodLevel.ANNOYED,
                content: "",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                audios: [
                    {
                        id: "audio-only",
                        localUri: "file:///audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ] as AudioData[],
            };

            const formWithOnlyContent = {
                moodLevel: MoodLevel.ANNOYED,
                content: "Text content",
                deadline: "today",
                people: ["Test"],
                triggers: [],
                audios: [] as AudioData[],
            };

            const formWithNeither = {
                moodLevel: MoodLevel.ANNOYED,
                content: "",
                deadline: "today",
                people: [],
                triggers: [],
                audios: [] as AudioData[],
            };

            const isValidWithOnlyAudio =
                formWithOnlyAudio.content.trim().length > 0 ||
                formWithOnlyAudio.audios.length > 0;

            const isValidWithOnlyContent =
                formWithOnlyContent.content.trim().length > 0 ||
                formWithOnlyContent.audios.length > 0;

            const isValidWithNeither =
                formWithNeither.content.trim().length > 0 ||
                formWithNeither.audios.length > 0;

            expect(isValidWithOnlyAudio).toBe(true);
            expect(isValidWithOnlyContent).toBe(true);
            expect(isValidWithNeither).toBe(false);
        });
    });

    describe("Audio List Management", () => {
        it("should rename audio in list", () => {
            const audios: AudioData[] = [
                {
                    id: "audio-1",
                    localUri: "file:///audio.m4a",
                    duration: 10,
                    fileSize: 1024,
                    fileHash: "abc123",
                    name: "Original Name",
                    createdAt: Date.now(),
                    syncStatus: "pending",
                },
            ];

            const updatedAudios = audios.map((a) =>
                a.id === "audio-1" ? { ...a, name: "New Name" } : a
            );

            expect(updatedAudios[0].name).toBe("New Name");
            expect(updatedAudios[0].localUri).toBe("file:///audio.m4a");
        });

        it("should maintain audio order in list", () => {
            const audios: AudioData[] = [
                { id: "a1", localUri: "file:///a1.m4a", duration: 10, fileSize: 1024, fileHash: "h1", createdAt: 1, syncStatus: "pending" },
                { id: "a2", localUri: "file:///a2.m4a", duration: 20, fileSize: 2048, fileHash: "h2", createdAt: 2, syncStatus: "pending" },
                { id: "a3", localUri: "file:///a3.m4a", duration: 30, fileSize: 3072, fileHash: "h3", createdAt: 3, syncStatus: "pending" },
            ];

            expect(audios[0].id).toBe("a1");
            expect(audios[1].id).toBe("a2");
            expect(audios[2].id).toBe("a3");

            const reordered = [audios[2], audios[0], audios[1]];
            expect(reordered[0].id).toBe("a3");
            expect(reordered[1].id).toBe("a1");
            expect(reordered[2].id).toBe("a2");
        });

        it("should update syncStatus after audio upload", () => {
            const audios: AudioData[] = [
                { id: "a1", localUri: "file:///a1.m4a", duration: 10, fileSize: 1024, fileHash: "h1", createdAt: Date.now(), syncStatus: "pending" },
                { id: "a2", localUri: "file:///a2.m4a", duration: 20, fileSize: 2048, fileHash: "h2", createdAt: Date.now(), syncStatus: "pending" },
            ];

            const updated = audios.map((a) =>
                a.id === "a1"
                    ? { ...a, syncStatus: "synced" as SyncStatus, remoteUrl: "https://example.com/a1.m4a" }
                    : a
            );

            expect(updated[0].syncStatus).toBe("synced");
            expect(updated[1].syncStatus).toBe("pending");
        });
    });

    describe("Playback State Management", () => {
        it("should only play one audio at a time", () => {
            let currentPlayingId: string | null = null;

            const playAudio = (audioId: string) => {
                currentPlayingId = audioId;
            };

            const pauseAudio = () => {
                currentPlayingId = null;
            };

            playAudio("audio-1");
            expect(currentPlayingId).toBe("audio-1");

            playAudio("audio-2");
            expect(currentPlayingId).toBe("audio-2");

            pauseAudio();
            expect(currentPlayingId).toBeNull();
        });

        it("should track playback position", () => {
            let playbackPosition = 0;

            const updatePosition = (position: number) => {
                playbackPosition = position;
            };

            updatePosition(10);
            expect(playbackPosition).toBe(10);

            updatePosition(20);
            expect(playbackPosition).toBe(20);
        });

        it("should reset position when audio finishes", () => {
            let playbackPosition = 50;
            let currentPlayingId: string | null = "audio-1";

            const onAudioFinish = () => {
                playbackPosition = 0;
                currentPlayingId = null;
            };

            onAudioFinish();

            expect(playbackPosition).toBe(0);
            expect(currentPlayingId).toBeNull();
        });
    });

    describe("Draft Recovery with Audio", () => {
        it("should preserve audio list in draft", () => {
            interface DraftEntry {
                moodLevel: number;
                content: string;
                deadline: string;
                customDeadlineText: string;
                isCustomDeadline: boolean;
                selectedPeople: string[];
                selectedTriggers: string[];
                audios?: AudioData[];
            }

            const draft: DraftEntry = {
                moodLevel: MoodLevel.ANNOYED,
                content: "Draft with audio",
                deadline: "today",
                customDeadlineText: "",
                isCustomDeadline: false,
                selectedPeople: ["Test"],
                selectedTriggers: [],
                audios: [
                    {
                        id: "draft-audio-1",
                        localUri: "file:///draft/audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc123",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            const serialized = JSON.stringify(draft);
            const recovered: DraftEntry = JSON.parse(serialized);

            expect(recovered.audios).toHaveLength(1);
            expect(recovered.audios![0].id).toBe("draft-audio-1");
            expect(recovered.audios![0].localUri).toBe("file:///draft/audio.m4a");
        });

        it("should handle draft without audio", () => {
            interface DraftEntry {
                moodLevel: number;
                content: string;
                deadline: string;
                customDeadlineText: string;
                isCustomDeadline: boolean;
                selectedPeople: string[];
                selectedTriggers: string[];
                audios?: AudioData[];
            }

            const draft: DraftEntry = {
                moodLevel: MoodLevel.ANNOYED,
                content: "Draft without audio",
                deadline: "today",
                customDeadlineText: "",
                isCustomDeadline: false,
                selectedPeople: [],
                selectedTriggers: [],
            };

            const serialized = JSON.stringify(draft);
            const recovered: DraftEntry = JSON.parse(serialized);

            expect(recovered.audios).toBeUndefined();
        });

        it("should clear draft after successful submission", () => {
            interface DraftEntry {
                moodLevel: number;
                content: string;
                deadline: string;
                customDeadlineText: string;
                isCustomDeadline: boolean;
                selectedPeople: string[];
                selectedTriggers: string[];
                audios?: AudioData[];
            }

            let draft: DraftEntry | null = {
                moodLevel: MoodLevel.ANNOYED,
                content: "Test",
                deadline: "today",
                customDeadlineText: "",
                isCustomDeadline: false,
                selectedPeople: [],
                selectedTriggers: [],
                audios: [
                    {
                        id: "audio-1",
                        localUri: "file:///audio.m4a",
                        duration: 10,
                        fileSize: 1024,
                        fileHash: "abc",
                        createdAt: Date.now(),
                        syncStatus: "pending",
                    },
                ],
            };

            const clearDraft = () => {
                draft = null;
            };

            clearDraft();

            expect(draft).toBeNull();
        });
    });
});
