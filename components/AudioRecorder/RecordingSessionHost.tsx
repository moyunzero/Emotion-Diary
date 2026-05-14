/**
 * 在根布局挂载，向全局 recordingCoordinator 注册唯一的 expo-audio Recorder（useAudioRecorder 须在 React 内调用）。
 */

import { RecordingPresets, useAudioRecorder } from "expo-audio";
import { useEffect } from "react";
import {
  registerRecordingRecorder,
  unregisterRecordingRecorder,
} from "../../shared/audio/recordingCoordinator";

export function RecordingSessionHost(): null {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    registerRecordingRecorder(recorder);
    return () => {
      unregisterRecordingRecorder(recorder);
    };
  }, [recorder]);

  return null;
}
