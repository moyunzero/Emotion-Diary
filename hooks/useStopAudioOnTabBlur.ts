import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import { forceCancelRecording } from "../shared/audio/recordingCoordinator";

/**
 * Tab 失焦时停止全局播放（与 Expo Router 默认「Tab 保持挂载」配合，避免切走仍播）。
 * 不在「获得焦点」时 forceCancel：会与新手势竞态（forceCancel 同步置 abortArmRequested，打断刚开始的 arm）。
 */
export function useStopAudioOnTabBlur(): void {
  useFocusEffect(
    useCallback(() => {
      return () => {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
      };
    }, []),
  );
}
