/**
 * 录音机主组件
 * 管理录音状态机、权限、录制和播放
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, View, Text } from "react-native";
import {
    useAudioRecorder,
    createAudioPlayer,
    useAudioRecorderState,
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    AudioStatus,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { copyAsync } from "expo-file-system/legacy";
import { cacheDirectory } from "expo-file-system/legacy";
import { AudioData } from "../../types";
import { RecordingState } from "../../store/modules/audio";
import RecordButton from "./RecordButton";
import WaveformView from "./WaveformView";
import AudioList from "./AudioList";

interface AudioRecorderProps {
    audios: AudioData[];
    onAudiosChange: (audios: AudioData[]) => void;
    currentPlayingId: string | null;
    isPlaying: boolean;
    playbackPosition: number;
    onPlaybackPositionChange: (position: number) => void;
    onPlayAudio: (audio: AudioData) => void;
    onPauseAudio: () => void;
    disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
    audios,
    onAudiosChange,
    currentPlayingId,
    isPlaying,
    playbackPosition,
    onPlaybackPositionChange,
    onPlayAudio,
    onPauseAudio,
    disabled = false,
}) => {
    const [recordingState, setRecordingState] = useState<RecordingState>("idle");
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder, 100);

    useEffect(() => {
        checkPermissions();
    }, []);

    useEffect(() => {
        if (audios.length > 0 && recordingState === 'preview') {
            setRecordingState('idle');
        }
    }, [audios.length, recordingState]);

    useEffect(() => {
        return () => {
            if (playerRef.current) {
                playerRef.current.pause();
                playerRef.current.remove();
                playerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (recorderState.durationMillis && recorderState.isRecording) {
            setRecordingDuration(recorderState.durationMillis / 1000);
        }
    }, [recorderState.durationMillis, recorderState.isRecording]);

    const checkPermissions = async () => {
        try {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            setHasPermission(status.granted);
        } catch (error) {
            console.error("Error checking permissions:", error);
            setHasPermission(false);
        }
    };

    const handleRecordingStart = useCallback(async () => {
        if (!hasPermission) {
            Alert.alert(
                "需要录音权限",
                "请在设置中开启麦克风权限",
                [
                    { text: "取消", style: "cancel" },
                    { text: "去设置", onPress: () => Linking.openSettings() },
                ]
            );
            return;
        }

        try {
            if (playerRef.current) {
                playerRef.current.pause();
                playerRef.current.remove();
                playerRef.current = null;
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
                interruptionMode: "duckOthers",
            });

            await recorder.prepareToRecordAsync();
            recorder.record();

            setRecordingState("recording");
            setRecordingDuration(0);
            setRecordedUri(null);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.error("Failed to start recording:", error);
            Alert.alert("录音失败", "无法开始录音，请重试");
            setRecordingState("idle");
        }
    }, [hasPermission, recorder]);

    const handleRecordingStop = useCallback(async () => {
        if (!recorderState.isRecording && !recordedUri) {
            setRecordingState("idle");
            return;
        }

        try {
            setRecordingState("processing");

            const uri = recorder.uri;
            const duration = recorderState.durationMillis
                ? recorderState.durationMillis / 1000
                : recordingDuration;

            await recorder.stop();

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
                interruptionMode: "mixWithOthers",
            });

            if (!uri) {
                throw new Error("No URI for recording");
            }

            const uniqueFileName = `recording_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`;
            const destUri = `${cacheDirectory || ''}${uniqueFileName}`;
            await copyAsync({ from: uri, to: destUri });

            const newAudio: AudioData = {
                id: Date.now().toString(),
                localUri: destUri,
                duration: duration,
                fileSize: 0,
                fileHash: "",
                createdAt: Date.now(),
                syncStatus: "pending",
            };

            setRecordingState("preview");
            setRecordedUri(null);
            onAudiosChange([...audios, newAudio]);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.error("Failed to stop recording:", error);
            Alert.alert("保存失败", "无法保存录音，请重试");
            setRecordingState("idle");
        }
    }, [recorder, recorderState, recordedUri, recordingDuration, audios, onAudiosChange]);

    const handleRecordingCancel = useCallback(async () => {
        try {
            if (recorderState.isRecording) {
                await recorder.stop();
            }

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });

            setRecordingState("idle");
            setRecordingDuration(0);
            setRecordedUri(null);
        } catch (error) {
            console.error("Failed to cancel recording:", error);
            setRecordingState("idle");
        }
    }, [recorder, recorderState]);

    const handlePlayAudio = useCallback(async (audio: AudioData) => {
        try {
            const uri = audio.localUri || audio.remoteUrl;
            if (!uri) {
                Alert.alert("播放失败", "无法播放录音，请重试");
                return;
            }

            if (currentPlayingId === audio.id && isPlaying) {
                return;
            }

            if (playerRef.current) {
                playerRef.current.pause();
                playerRef.current.remove();
                playerRef.current = null;
            }

            const player = createAudioPlayer(uri);
            playerRef.current = player;

            player.play();

            const statusListener = (status: AudioStatus) => {
                if (status.currentTime !== undefined) {
                    const clampedPosition = Math.min(status.currentTime, audio.duration);
                    onPlaybackPositionChange(clampedPosition);
                }
                if (status.didJustFinish) {
                    onPauseAudio();
                    onPlaybackPositionChange(0);
                    playerRef.current = null;
                }
            };

            player.addListener("playbackStatusUpdate" as any, statusListener);

            onPlayAudio(audio);
        } catch (error) {
            console.error("Failed to play audio:", error);
            Alert.alert("播放失败", "无法播放录音，请重试");
            playerRef.current = null;
        }
    }, [currentPlayingId, isPlaying, onPlayAudio, onPauseAudio, onPlaybackPositionChange]);

    const handlePauseAudio = useCallback(async () => {
        onPauseAudio();
    }, [onPauseAudio]);

    const handleDeleteAudio = useCallback((audioId: string) => {
        const updatedAudios = audios.filter((a) => a.id !== audioId);
        onAudiosChange(updatedAudios);
    }, [audios, onAudiosChange]);

    const handleRenameAudio = useCallback((audioId: string, newName: string) => {
        const updatedAudios = audios.map((a) =>
            a.id === audioId ? { ...a, name: newName } : a
        );
        onAudiosChange(updatedAudios);
    }, [audios, onAudiosChange]);

    return (
        <View style={styles.container}>
            <View style={styles.recordingSection}>
                <WaveformView
                    isActive={recordingState === "recording"}
                    color="#6C63FF"
                />

                <View style={styles.buttonContainer}>
                    <RecordButton
                        recordingState={recordingState}
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                        onRecordingCancel={handleRecordingCancel}
                        disabled={disabled}
                    />
                </View>

                {recordingState === "recording" && (
                    <View style={styles.durationContainer}>
                        <Text style={styles.durationText}>
                            {Math.floor(recordingDuration / 60)
                                .toString()
                                .padStart(2, "0")}
                            :
                            {Math.floor(recordingDuration % 60)
                                .toString()
                                .padStart(2, "0")}
                        </Text>
                    </View>
                )}
            </View>

            <AudioList
                audios={audios}
                currentPlayingId={currentPlayingId}
                isPlaying={isPlaying}
                playbackPosition={playbackPosition}
                onPlay={handlePlayAudio}
                onPause={handlePauseAudio}
                onDelete={handleDeleteAudio}
                onRename={handleRenameAudio}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
    },
    recordingSection: {
        alignItems: "center",
        paddingVertical: 20,
    },
    buttonContainer: {
        marginTop: 16,
    },
    durationContainer: {
        marginTop: 12,
    },
    durationText: {
        fontSize: 24,
        fontWeight: "600",
        color: "#333",
        fontVariant: ["tabular-nums"],
    },
});

export default AudioRecorder;
