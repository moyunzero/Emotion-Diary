import { i18n } from "@/i18n";
import { audioCoordinator } from "@/shared/audio/coordinator";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useAppStore } from "../../store/useAppStore";
import { createEntryCardStyles } from "../../styles/components/EntryCard.styles";
import { AudioData, MoodEntry } from "../../types";

export type EntryCardPlaybackProps = {
  entry: MoodEntry;
  styles: ReturnType<typeof createEntryCardStyles>;
  isExpanded: boolean;
};

export type EntryCardBurnedPlaybackProps = {
  entry: MoodEntry;
  styles: ReturnType<typeof createEntryCardStyles>;
  isExpanded: boolean;
};

function useEntryCardPlaybackState(entryId: string) {
  const currentAudioId = useAppStore((s) =>
    s.playbackEntryId === entryId ? s.currentAudioId : null,
  );
  const isPlayingGlobal = useAppStore(
    (s) => s.playbackEntryId === entryId && s.isPlaying,
  );
  const retryAudioUpload = useAppStore((state) => state.retryAudioUpload);

  return {
    currentAudioId,
    isPlayingGlobal,
    retryAudioUpload,
  };
}

function sortClipsAscending(audios: AudioData[]): AudioData[] {
  return [...audios].sort((a, b) => a.createdAt - b.createdAt);
}

/** Active / resolved echo strip — collapsed + expanded (D-01 / D-09). Single-clip tracer. */
export function EntryCardPlayback({
  entry,
  styles,
}: EntryCardPlaybackProps) {
  const { t } = useTranslation("dashboard");
  const { t: tSystem } = useTranslation("system");
  const { trigger: triggerHaptic } = useHapticFeedback();
  const { currentAudioId, isPlayingGlobal, retryAudioUpload } =
    useEntryCardPlaybackState(entry.id);

  const primaryClip = useMemo(() => {
    if (!entry.audios || entry.audios.length === 0) return null;
    return sortClipsAscending(entry.audios)[0] ?? null;
  }, [entry.audios]);

  const isStripPlaying =
    !!primaryClip && currentAudioId === primaryClip.id && isPlayingGlobal;

  const handleStripPress = useCallback(async () => {
    if (!primaryClip) return;
    try {
      const result = await audioCoordinator.playEntryAudio(
        entry.id,
        primaryClip,
      );
      if (result.ok) {
        triggerHaptic("light");
        return;
      }
      if (result.reason === "no_uri") {
        Alert.alert(
          i18n.t("alerts.playbackFailed.title", { ns: "dashboard" }),
          i18n.t("alerts.playbackFailed.bodyMissing", { ns: "dashboard" }),
        );
      } else {
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
  }, [entry.id, primaryClip, triggerHaptic]);

  if (!primaryClip) {
    return null;
  }

  const stripLabel = t("entryCard.echoStripLabel");

  return (
    <View style={styles.echoStripSection}>
      <Pressable
        style={({ pressed }) => [
          styles.echoStrip,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => {
          void handleStripPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={stripLabel}
        accessibilityState={{
          selected: isStripPlaying,
          busy: isStripPlaying,
        }}
        testID="entry-echo-strip"
        hitSlop={8}
      >
        <Text style={styles.echoStripLabel} numberOfLines={1}>
          {stripLabel}
        </Text>
      </Pressable>
      {primaryClip.syncStatus === "pending" && (
        <Text style={styles.echoStripFootnote}>
          {tSystem("audio.pendingUpload")}
        </Text>
      )}
      {primaryClip.syncStatus === "failed" && (
        <TouchableOpacity
          onPress={() => retryAudioUpload(entry.id, primaryClip.id)}
          accessibilityRole="button"
          accessibilityLabel={tSystem("audio.retryUploadA11y")}
          hitSlop={8}
        >
          <Text style={styles.echoStripRetry}>
            {t("entryCard.echoStripRetryUpload")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Burned (ash) audio chrome — Plan 04 replaces with smoke strip (ECHO-03).
 * Stub keeps import sites compiling; no playable list (D-09).
 */
export function EntryCardBurnedPlayback(_props: EntryCardBurnedPlaybackProps) {
  return null;
}
