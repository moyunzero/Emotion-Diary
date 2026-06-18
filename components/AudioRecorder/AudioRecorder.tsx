/**
 * 录音机主组件：列表与试听 UI；录音状态与原生由全局 recordingCoordinator + Zustand 驱动。
 */

import { useIsFocused } from "@react-navigation/native";
import { AudioModule } from "expo-audio";
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { i18n } from "@/i18n";
import { audioCoordinator } from "../../shared/audio/coordinator";
import {
  dismissRecordingPreview,
  forceCancelRecording,
  releaseRecordingClipHandler,
  setRecordingClipHandler,
} from "../../shared/audio/recordingCoordinator";
import { useAppStore } from "../../store/useAppStore";
import { AudioData } from "../../types";
import { AudioList } from "./AudioList";
import { RecordButton } from "./RecordButton";
import { WaveformView } from "./WaveformView";

/** 创建页强调录音；编辑弹窗优先已有语音、压缩录音区占位 */
export type AudioRecorderLayoutPreset = "create" | "edit";

/**
 * 全局 clipHandler 注册策略（单例协调器只能绑定一个接收方）：
 * - `tab-focus`：仅当前 Tab 获得导航焦点时注册（记一笔）；离开 Tab 时释放，避免被编辑层抢占后永久 null
 * - `{ active: boolean }`：由父组件显式控制（编辑弹层仅在 visible 时注册）
 */
export type AudioClipBinding = "tab-focus" | { active: boolean };

interface AudioRecorderProps {
  readonly audios: AudioData[];
  readonly onAudiosChange: (audios: AudioData[]) => void;
  readonly disabled?: boolean;
  readonly layoutPreset?: AudioRecorderLayoutPreset;
  readonly clipBinding?: AudioClipBinding;
}

export interface AudioRecorderHandle {
  stopPlayback: () => void;
}

export const AudioRecorder = React.forwardRef<
  AudioRecorderHandle,
  AudioRecorderProps
>(({ audios, onAudiosChange, disabled = false, layoutPreset = "create", clipBinding = "tab-focus" }, ref) => {
  const { t } = useTranslation("record");
  const isNavFocused = useIsFocused();
  const currentPlayingId = useAppStore((s) => s.currentAudioId);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const playbackPosition = useAppStore((s) => s.playbackPosition);
  const recordingState = useAppStore((s) => s.recordingState);
  const recordingDuration = useAppStore((s) => s.recordingDuration);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const audiosRef = useRef(audios);
  const onAudiosChangeRef = useRef(onAudiosChange);

  useImperativeHandle(ref, () => ({
    stopPlayback: () => {
      audioCoordinator.stop();
    },
  }));

  useEffect(() => {
    audiosRef.current = audios;
    onAudiosChangeRef.current = onAudiosChange;
  }, [audios, onAudiosChange]);

  const dispatchClip = useCallback((clip: AudioData) => {
    onAudiosChangeRef.current([...audiosRef.current, clip]);
  }, []);

  const clipChannelActive =
    clipBinding === "tab-focus" ? isNavFocused : clipBinding.active;

  useEffect(() => {
    if (!clipChannelActive) {
      releaseRecordingClipHandler(dispatchClip);
      return;
    }
    setRecordingClipHandler(dispatchClip);
    return () => {
      releaseRecordingClipHandler(dispatchClip);
    };
  }, [clipChannelActive, dispatchClip]);

  useEffect(() => {
    if (audios.length > 0 && recordingState === "preview") {
      dismissRecordingPreview();
    }
  }, [audios.length, recordingState]);

  useEffect(() => {
    const run = async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        setHasPermission(status.granted);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasPermission(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    return () => {
      audioCoordinator.stop();
      void forceCancelRecording();
    };
  }, []);

  const handlePlayAudio = useCallback(
    async (audio: AudioData) => {
      try {
        if (currentPlayingId === audio.id && isPlaying) {
          return;
        }

        const result = await audioCoordinator.playDraftAudio(audio);
        if (!result.ok) {
          Alert.alert(
            i18n.t("alerts.playbackFailed.title", { ns: "dashboard" }),
            i18n.t("alerts.playbackFailed.bodyRetry", { ns: "dashboard" }),
          );
        }
      } catch (error) {
        console.error("Failed to play audio:", error);
        Alert.alert(
          i18n.t("alerts.playbackFailed.title", { ns: "dashboard" }),
          i18n.t("alerts.playbackFailed.bodyRetry", { ns: "dashboard" }),
        );
      }
    },
    [currentPlayingId, isPlaying],
  );

  const handlePauseAudio = useCallback(() => {
    audioCoordinator.pause();
  }, []);

  const handleDeleteAudio = useCallback(
    (audioId: string) => {
      if (audioId === currentPlayingId) {
        audioCoordinator.stop();
      }
      const updatedAudios = audios.filter((a) => a.id !== audioId);
      onAudiosChange(updatedAudios);
    },
    [audios, currentPlayingId, onAudiosChange],
  );

  const handleRenameAudio = useCallback(
    (audioId: string, newName: string) => {
      const updatedAudios = audios.map((a) =>
        a.id === audioId ? { ...a, name: newName } : a,
      );
      onAudiosChange(updatedAudios);
    },
    [audios, onAudiosChange],
  );

  const isEditLayout = layoutPreset === "edit";
  const showWaveform =
    !isEditLayout || recordingState === "recording";
  const editListFirst = isEditLayout && audios.length > 0;

  const recordDisabled = disabled || hasPermission === false;

  const recordingSection = (
    <View
      style={[
        styles.recordingSection,
        isEditLayout && styles.recordingSectionEdit,
      ]}
    >
      {showWaveform ? (
        <WaveformView
          isActive={recordingState === "recording"}
          color="#6C63FF"
        />
      ) : null}

      <View
        style={[
          styles.buttonContainer,
          !showWaveform && styles.buttonContainerTightTop,
        ]}
      >
        <RecordButton disabled={recordDisabled} compact={isEditLayout} />
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
  );

  const list = (
    <AudioList
      audios={audios}
      currentPlayingId={currentPlayingId}
      isPlaying={isPlaying}
      playbackPosition={playbackPosition}
      onPlay={handlePlayAudio}
      onPause={handlePauseAudio}
      onDelete={handleDeleteAudio}
      onRename={handleRenameAudio}
      headerTitle={t("audio.list.headerTitle")}
      headerVariant={isEditLayout ? "minimal" : "default"}
      listPlacement={
        editListFirst ? "before-recording" : "after-recording"
      }
    />
  );

  return (
    <View
      style={[styles.container, isEditLayout && styles.containerEdit]}
    >
      {editListFirst ? (
        <>
          {list}
          {recordingSection}
        </>
      ) : (
        <>
          {recordingSection}
          {list}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  containerEdit: {
    paddingHorizontal: 0,
  },
  recordingSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  recordingSectionEdit: {
    paddingVertical: 10,
  },
  buttonContainer: {
    marginTop: 16,
  },
  buttonContainerTightTop: {
    marginTop: 0,
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

AudioRecorder.displayName = "AudioRecorder";

export default AudioRecorder;
