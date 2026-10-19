/**
 * __DEV__ only — Maestro probe for audio re-upload boundaries and playback.
 * Production builds leave this route without touching audio.
 */

import { audioCoordinator } from "@/shared/audio/coordinator";
import {
  auditStorePlayback,
  runRepairBoundaryReport,
} from "@/store/sync/audioRepairProbe";
import { useAppStore } from "@/store/useAppStore";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";

export default function DevAudioRepairScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [repair, setRepair] = useState("");
  const [playback, setPlayback] = useState("");
  const status = playback.startsWith("playback:pass")
    ? "playback:pass"
    : playback.startsWith("playback:fail")
      ? "playback:fail"
      : "";

  useEffect(() => {
    if (!__DEV__) {
      router.replace("/" as Href);
      return;
    }

    const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
    let cancelled = false;

    void (async () => {
      if (mode !== "play") {
        const line = await runRepairBoundaryReport();
        if (!cancelled) setRepair(line);
      }
      if (mode === "play" || mode === "all") {
        const line = await auditStorePlayback({
          entries: useAppStore.getState().entries,
          play: (entryId, audio) => audioCoordinator.playEntryAudio(entryId, audio),
          read: () => {
            const state = useAppStore.getState();
            return {
              playbackPosition: state.playbackPosition,
              currentAudioId: state.currentAudioId,
            };
          },
          stop: () => audioCoordinator.stop(),
        });
        if (!cancelled) setPlayback(line);
      }
    })();

    return () => {
      cancelled = true;
      audioCoordinator.stop();
    };
  }, [params.mode, router]);

  if (!__DEV__) {
    return null;
  }

  return (
    <ScrollView testID="audio-repair-probe">
      <Text testID="audio-repair-result">{repair}</Text>
      <Text testID="audio-playback-status">{status}</Text>
      <Text testID="audio-playback-result">{playback}</Text>
    </ScrollView>
  );
}
