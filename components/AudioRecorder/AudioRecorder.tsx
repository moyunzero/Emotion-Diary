/**
 * 录音机主组件
 * 管理录音状态机、权限、录制和播放
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking, StyleSheet, View, Text } from "react-native";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
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
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        const result = await Audio.requestPermissionsAsync();
        setHasPermission(result.granted);
      }
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
      await cleanup();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis / 1000);
        }
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      setRecordingState("recording");
      setRecordingDuration(0);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("录音失败", "无法开始录音，请重试");
      setRecordingState("idle");
    }
  }, [hasPermission]);

  const handleRecordingStop = useCallback(async () => {
    if (!recordingRef.current) {
      setRecordingState("idle");
      return;
    }

    try {
      setRecordingState("processing");

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = recordingRef.current.getStatusAsync();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) {
        throw new Error("No URI for recording");
      }

      const newAudio: AudioData = {
        id: Date.now().toString(),
        localUri: uri,
        duration: recordingDuration,
        fileSize: 0,
        fileHash: "",
        createdAt: Date.now(),
        syncStatus: "pending",
      };

      setRecordingState("preview");
      onAudiosChange([...audios, newAudio]);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("保存失败", "无法保存录音，请重试");
      setRecordingState("idle");
    }
  }, [audios, recordingDuration, onAudiosChange]);

  const handleRecordingCancel = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setRecordingState("idle");
      setRecordingDuration(0);
    } catch (error) {
      console.error("Failed to cancel recording:", error);
      setRecordingState("idle");
    }
  }, []);

  const handlePlayAudio = useCallback(async (audio: AudioData) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const uri = audio.localUri || audio.remoteUrl;
      if (!uri) {
        throw new Error("No audio URI");
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            onPlaybackPositionChange(status.positionMillis / 1000);
            if (status.didJustFinish) {
              onPauseAudio();
              onPlaybackPositionChange(0);
            }
          }
        }
      );

      soundRef.current = sound;
      onPlayAudio(audio);
    } catch (error) {
      console.error("Failed to play audio:", error);
      Alert.alert("播放失败", "无法播放录音，请重试");
    }
  }, [onPlayAudio, onPauseAudio, onPlaybackPositionChange]);

  const handlePauseAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      onPauseAudio();
    }
  }, [onPauseAudio]);

  const handleDeleteAudio = useCallback((audioId: string) => {
    const updatedAudios = audios.filter((a) => a.id !== audioId);
    onAudiosChange(updatedAudios);

    if (currentPlayingId === audioId && soundRef.current) {
      handlePauseAudio();
    }
  }, [audios, currentPlayingId, onAudiosChange, handlePauseAudio]);

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
