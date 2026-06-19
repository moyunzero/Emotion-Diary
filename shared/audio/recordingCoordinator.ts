/**
 * 全局单一录音协调器：原生 Recorder 单例 + Zustand 状态同步。
 * Recorder 实例由 RecordingSessionHost（useAudioRecorder）注入。
 */

import type { AudioRecorder as ExpoAudioRecorder } from "expo-audio";
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  getInfoAsync,
} from "expo-file-system";
import * as Haptics from "expo-haptics";
import { md5 } from "js-md5";
import { Alert, Linking } from "react-native";
import { i18n } from "@/i18n";
import type { AudioData, RecordingState } from "../../types";
import { logger } from "../../utils/logger";
import { audioCoordinator } from "./coordinator";

const PRESS_DURATION_THRESHOLD_MS = 300;
const DURATION_POLL_MS = 100;

/** expo-audio Recorder 已随宿主卸载释放时，JS 包装器上调用 getStatus/stop 会抛此类错，属预期竞态，勿作 WARN。 */
function isStaleNativeRecorderError(error: unknown): boolean {
  const parts: string[] = [];
  let cur: unknown = error;
  for (let i = 0; i < 6 && cur != null; i++) {
    if (cur instanceof Error) {
      parts.push(cur.name, cur.message);
      cur = cur.cause;
    } else {
      parts.push(String(cur));
      break;
    }
  }
  const blob = parts.join("\n");
  return (
    blob.includes("NativeSharedObjectNotFound") ||
    blob.includes("Unable to find the native shared object")
  );
}

export type RecordingStorePatch = {
  recordingState?: RecordingState;
  recordingDuration?: number;
  currentRecordingUri?: string | null;
};

type SyncFn = (patch: RecordingStorePatch) => void;
type ClipHandler = (clip: AudioData) => void;
type RecordingStateReader = () => RecordingState;

let syncToStore: SyncFn | null = null;
let readRecordingState: RecordingStateReader | null = null;
let recorderRef: ExpoAudioRecorder | null = null;
let clipHandler: ClipHandler | null = null;

let durationPollTimer: ReturnType<typeof setInterval> | null = null;

let pressStartedAt: number | null = null;
let abortArmRequested = false;
let armInFlight = false;

function clearDurationPoll(): void {
  if (durationPollTimer) {
    clearInterval(durationPollTimer);
    durationPollTimer = null;
  }
}

function startDurationPoll(): void {
  clearDurationPoll();
  durationPollTimer = setInterval(() => {
    const r = recorderRef;
    if (!r || !syncToStore) return;
    try {
      const st = r.getStatus();
      if (st.isRecording && st.durationMillis !== undefined) {
        syncToStore({ recordingDuration: st.durationMillis / 1000 });
      }
    } catch {
      // ignore
    }
  }, DURATION_POLL_MS);
}

function applyIdle(): void {
  clearDurationPoll();
  syncToStore?.({
    recordingState: "idle",
    recordingDuration: 0,
    currentRecordingUri: null,
  });
}

function applyPreview(): void {
  clearDurationPoll();
  syncToStore?.({
    recordingState: "preview",
    recordingDuration: 0,
    currentRecordingUri: null,
  });
}

function currentRecordingState(): RecordingState {
  return readRecordingState?.() ?? "idle";
}

export function initRecordingCoordinator(
  sync: SyncFn,
  getRecordingState: RecordingStateReader,
): void {
  syncToStore = sync;
  readRecordingState = getRecordingState;
}

export function registerRecordingRecorder(recorder: ExpoAudioRecorder): void {
  recorderRef = recorder;
}

export function unregisterRecordingRecorder(recorder: ExpoAudioRecorder): void {
  if (recorderRef === recorder) {
    void forceCancelRecording();
    recorderRef = null;
  }
}

export function setRecordingClipHandler(handler: ClipHandler | null): void {
  clipHandler = handler;
}

/**
 * 仅当当前全局 handler 仍是本人时清空。
 * 避免：编辑弹窗内 AudioRecorder 卸载时 `setRecordingClipHandler(null)` 把「记一笔」页已挂载实例的回调抹掉。
 */
export function releaseRecordingClipHandler(handler: ClipHandler): void {
  if (clipHandler === handler) {
    clipHandler = null;
  }
}

/** 与旧行为一致：已有附件且处于 preview 时回到 idle 主按钮 */
export function dismissRecordingPreview(): void {
  syncToStore?.({ recordingState: "idle" });
}

async function cleanupNativeAfterStop(opts: {
  resetMode: boolean;
}): Promise<void> {
  const r = recorderRef;
  if (!r) return;
  try {
    const st = r.getStatus();
    if (st.isRecording) {
      await r.stop();
    }
  } catch (e) {
    if (!isStaleNativeRecorderError(e)) {
      logger.warn("recordingCoordinator", "stop 录音失败", e);
    }
  }
  if (opts.resetMode) {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "mixWithOthers",
      });
    } catch (e) {
      logger.warn("recordingCoordinator", "setAudioModeAsync 恢复失败", e);
    }
  }
}

async function runArmSequence(): Promise<void> {
  const r = recorderRef;
  if (!r) {
    // pressIn 已把 UI 置为 preparing，但若此时 recorder 被注销（极少见竞态），须回落 idle，否则会永久卡死
    if (currentRecordingState() === "preparing") {
      applyIdle();
    }
    return;
  }
  if (armInFlight) return;

  armInFlight = true;
  abortArmRequested = false;

  try {
    const status = await requestRecordingPermissionsAsync();
    if (!status.granted) {
      Alert.alert(
        i18n.t("audio.permission.title", { ns: "system" }),
        i18n.t("audio.permission.message", { ns: "system" }),
        [
          {
            text: i18n.t("actions.cancel", { ns: "common" }),
            style: "cancel",
          },
          {
            text: i18n.t("audio.permission.openSettings", { ns: "system" }),
            onPress: () => void Linking.openSettings(),
          },
        ],
      );
      applyIdle();
      return;
    }

    if (abortArmRequested) {
      applyIdle();
      return;
    }

    audioCoordinator.stop();
    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    if (abortArmRequested) {
      applyIdle();
      return;
    }

    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    if (abortArmRequested) {
      await cleanupNativeAfterStop({ resetMode: true });
      applyIdle();
      return;
    }

    await r.prepareToRecordAsync();

    if (abortArmRequested) {
      await cleanupNativeAfterStop({ resetMode: true });
      applyIdle();
      return;
    }

    r.record();
    syncToStore?.({
      recordingState: "recording",
      currentRecordingUri: r.uri,
      recordingDuration: 0,
    });
    startDurationPoll();

    if (abortArmRequested) {
      await cleanupNativeAfterStop({ resetMode: true });
      applyIdle();
    }
  } catch (e) {
    logger.warn("recordingCoordinator", "开始录音失败", e);
    Alert.alert(
      i18n.t("audio.recordFailed.title", { ns: "system" }),
      i18n.t("audio.recordFailed.message", { ns: "system" }),
    );
    await cleanupNativeAfterStop({ resetMode: true }).catch(() => {});
    applyIdle();
  } finally {
    armInFlight = false;
  }
}

async function cancelRecordingInternal(): Promise<void> {
  await forceCancelRecording();
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

async function commitStopInternal(): Promise<void> {
  const r = recorderRef;
  if (!r) {
    applyIdle();
    return;
  }

  clearDurationPoll();

  try {
    syncToStore?.({ recordingState: "processing" });

    const sourceUri = r.uri;
    const st = r.getStatus();
    const durationSec = st.durationMillis ? st.durationMillis / 1000 : 0;

    await r.stop();

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });

    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    if (!sourceUri) {
      throw new Error("No URI for recording");
    }

    const uniqueFileName = `recording_${Date.now()}_${Math.random().toString(36).substring(7)}.m4a`;
    const destUri = `${cacheDirectory || ""}${uniqueFileName}`;
    await copyAsync({ from: sourceUri, to: destUri });

    const fileInfo = await getInfoAsync(destUri);
    const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;
    const fileHash = md5(destUri);

    await deleteAsync(sourceUri).catch((err) => {
      logger.warn("recordingCoordinator", "清理录音源文件失败", err);
    });

    const newAudio: AudioData = {
      id: Date.now().toString(),
      localUri: destUri,
      duration: durationSec,
      fileSize,
      fileHash,
      createdAt: Date.now(),
      syncStatus: "pending",
    };

    clipHandler?.(newAudio);
    applyPreview();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    console.error("Failed to stop recording:", e);
    Alert.alert(
      i18n.t("audio.saveFailed.title", { ns: "system" }),
      i18n.t("audio.saveFailed.message", { ns: "system" }),
    );
    await cleanupNativeAfterStop({ resetMode: true }).catch(() => {});
    applyIdle();
  }
}

export const recordingCoordinator = {
  pressIn(): void {
    const r = recorderRef;
    if (!r) {
      if (__DEV__) {
        logger.warn(
          "recordingCoordinator",
          "Recorder 未注册（RecordingSessionHost 是否已挂载？）",
        );
      }
      return;
    }

    const rs = currentRecordingState();
    if (rs !== "idle" && rs !== "preview") {
      return;
    }

    pressStartedAt = Date.now();
    abortArmRequested = false;

    syncToStore?.({
      recordingState: "preparing",
      recordingDuration: 0,
      currentRecordingUri: null,
    });

    void runArmSequence();
  },

  pressOut(): void {
    if (!recorderRef) {
      pressStartedAt = null;
      return;
    }

    const rs = currentRecordingState();
    const started = pressStartedAt;

    if (rs === "preparing") {
      abortArmRequested = true;
      pressStartedAt = null;
      return;
    }

    if (rs !== "recording") {
      pressStartedAt = null;
      return;
    }

    pressStartedAt = null;

    const durationMs =
      started !== null ? Date.now() - started : PRESS_DURATION_THRESHOLD_MS;

    if (durationMs < PRESS_DURATION_THRESHOLD_MS) {
      void cancelRecordingInternal();
    } else {
      void commitStopInternal();
    }
  },
};

export async function forceCancelRecording(): Promise<void> {
  abortArmRequested = true;
  pressStartedAt = null;

  try {
    const r = recorderRef;
    if (!r) {
      applyIdle();
      return;
    }

    try {
      const st = r.getStatus();
      if (st.isRecording) {
        await r.stop();
      }
    } catch (e) {
      if (!isStaleNativeRecorderError(e)) {
        logger.warn("recordingCoordinator", "forceCancel stop 失败", e);
      }
    }

    try {
      const uri = r.uri;
      if (uri) {
        // stop() 后原生侧可能已删掉临时文件，再 delete 会报「不存在」——仅在实际存在时删，避免误报警告
        const info = await getInfoAsync(uri);
        if (info.exists) {
          await deleteAsync(uri).catch((err) => {
            logger.warn("recordingCoordinator", "取消时删源文件失败", err);
          });
        }
      }
    } catch {
      // ignore
    }

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});

    applyIdle();
  } finally {
    // 无 recorder / 切页打断 arm 时也要释放，否则 pressIn 会在 runArmSequence 开头被静默忽略
    armInFlight = false;
  }
}

/** 供 store 的 `stopRecording`：仅在原生处于录音中时落盘（无 UI 按压场景） */
export async function commitRecordingIfActive(): Promise<AudioData | null> {
  const r = recorderRef;
  if (!r) {
    return null;
  }
  try {
    if (!r.getStatus().isRecording) {
      return null;
    }
  } catch {
    return null;
  }
  await commitStopInternal();
  return null;
}
