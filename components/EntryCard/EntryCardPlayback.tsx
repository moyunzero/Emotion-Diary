import { i18n } from "@/i18n";
import { audioCoordinator } from "@/shared/audio/coordinator";
import { sortClipsAscending } from "@/shared/entries/echoClips";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useAppStore } from "../../store/useAppStore";
import { createEntryCardStyles } from "../../styles/components/EntryCard.styles";
import { MoodEntry } from "../../types";

export type EntryCardPlaybackProps = {
  entry: MoodEntry;
  styles: ReturnType<typeof createEntryCardStyles>;
  isExpanded: boolean;
};

export type EntryCardSmokeStripProps = {
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
  // Gated: only the active card re-renders on position ticks (Pitfall 4)
  const playbackPosition = useAppStore((s) =>
    s.playbackEntryId === entryId ? s.playbackPosition : 0,
  );
  const playbackDuration = useAppStore((s) =>
    s.playbackEntryId === entryId ? s.duration : 0,
  );
  const retryAudioUpload = useAppStore((state) => state.retryAudioUpload);

  return {
    currentAudioId,
    isPlayingGlobal,
    playbackPosition,
    playbackDuration,
    retryAudioUpload,
  };
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
        entry.status,
      );
      if (result.ok) {
        triggerHaptic("light");
        return;
      }
      // D-35 / PATTERNS: burned reject is silent — no Alert
      if (result.reason === "burned") {
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
  }, [entry.id, entry.status, primaryClip, triggerHaptic]);

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
 * Burned-had-audio smoke strip (ECHO-03 / D-29..D-34).
 * Disabled chrome only — no play, no Alert, no chips.
 */
export function EntryCardSmokeStrip({
  entry,
  styles,
}: EntryCardSmokeStripProps) {
  const { t } = useTranslation("dashboard");

  if (!entry.audios || entry.audios.length === 0) {
    return null;
  }

  const smokeLabel = t("entryCard.smokeStripLabel");
  const smokeA11y = t("entryCard.smokeStripA11y");

  return (
    <View style={styles.echoStripSection}>
      <Pressable
        style={styles.smokeStrip}
        disabled
        accessibilityRole="button"
        accessibilityLabel={smokeA11y}
        accessibilityState={{ disabled: true }}
        testID="entry-smoke-strip"
        // D-30: tap must not play or Alert — Pressable disabled; no onPress
      >
        <Text style={styles.smokeStripLabel} numberOfLines={1}>
          {smokeLabel}
        </Text>
      </Pressable>
    </View>
  );
}
