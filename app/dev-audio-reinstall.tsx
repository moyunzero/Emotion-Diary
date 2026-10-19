/**
 * __DEV__ only — backup one real recording, or play it after a reinstall.
 * Production builds leave this route without uploading.
 */

import { audioCoordinator } from "@/shared/audio/coordinator";
import {
  runReinstallBackup,
  runReinstallPlayback,
} from "@/store/sync/reinstallAudioProbe";
import { useAppStore } from "@/store/useAppStore";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function DevAudioReinstallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const [line, setLine] = useState("");

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/" as Href);
      return;
    }

    const step = Array.isArray(params.step) ? params.step[0] : params.step;
    let cancelled = false;

    void (async () => {
      try {
        const next =
          step === "play"
            ? await runReinstallPlayback({
                pull: () => useAppStore.getState().syncFromCloud(),
                getEntries: () => useAppStore.getState().entries,
                play: (entryId, audio) =>
                  audioCoordinator.playEntryAudio(entryId, audio),
                read: () => {
                  const state = useAppStore.getState();
                  return {
                    playbackPosition: state.playbackPosition,
                    currentAudioId: state.currentAudioId,
                  };
                },
                stop: () => audioCoordinator.stop(),
              })
            : await runReinstallBackup({
                getEntries: () => useAppStore.getState().entries,
                setEntries: (entries) => useAppStore.getState()._setEntries(entries),
                syncToCloud: () => useAppStore.getState().syncToCloud(),
              });
        if (!cancelled) setLine(next);
      } catch {
        if (!cancelled) setLine(step === "play" ? "reinstall:fail:pull" : "backup:fail");
      }
    })();

    return () => {
      cancelled = true;
      audioCoordinator.stop();
    };
  }, [params.step, router]);

  if (!__DEV__) {
    return null;
  }

  return (
    <View testID="audio-reinstall-probe">
      <Text testID="audio-reinstall-result">{line}</Text>
    </View>
  );
}
