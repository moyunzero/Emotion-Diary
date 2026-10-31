import { AppChip } from "@/components/ui/AppChip";
import { i18n } from "@/i18n";
import { audioCoordinator } from "@/shared/audio/coordinator";
import {
  needsClipChips,
  sortClipsAscending,
  truncateClipShortName,
} from "@/shared/entries/echoClips";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useAppStore } from "../../store/useAppStore";
import { createEntryCardStyles } from "../../styles/components/EntryCard.styles";
import { AudioData, MoodEntry } from "../../types";

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

async function playClipWithFeedback(params: {
  entryId: string;
  entryStatus: MoodEntry["status"];
  clip: AudioData;
  triggerHaptic: ReturnType<typeof useHapticFeedback>["trigger"];
}): Promise<void> {
  const { entryId, entryStatus, clip, triggerHaptic } = params;
  try {
    const result = await audioCoordinator.playEntryAudio(
      entryId,
      clip,
      entryStatus,
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
}

/** Active / resolved echo strip — collapsed + expanded (D-01 / D-09). Multi-clip chips (D-21..28). */
export function EntryCardPlayback({
  entry,
  styles,
}: EntryCardPlaybackProps) {
  const { t } = useTranslation("dashboard");
  const { t: tSystem } = useTranslation("system");
  const { trigger: triggerHaptic } = useHapticFeedback();
  const { currentAudioId, isPlayingGlobal, retryAudioUpload } =
    useEntryCardPlaybackState(entry.id);

  const clips = useMemo(
    () => sortClipsAscending(entry.audios ?? []),
    [entry.audios],
  );
  const showChips = needsClipChips(clips.length);

  // Ephemeral selected clip (A4); default oldest = 第 1 声 (D-21 / D-28)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  useEffect(() => {
    if (
      currentAudioId &&
      clips.some((clip) => clip.id === currentAudioId)
    ) {
      setSelectedClipId(currentAudioId);
    }
  }, [currentAudioId, clips]);

  const activeClip = useMemo(() => {
    if (clips.length === 0) return null;
    const preferredId = selectedClipId ?? clips[0]?.id;
    return clips.find((clip) => clip.id === preferredId) ?? clips[0] ?? null;
  }, [clips, selectedClipId]);

  const isStripPlaying =
    isPlayingGlobal &&
    !!currentAudioId &&
    clips.some((clip) => clip.id === currentAudioId);

  const handlePlayClip = useCallback(
    (clip: AudioData) => {
      setSelectedClipId(clip.id);
      void playClipWithFeedback({
        entryId: entry.id,
        entryStatus: entry.status,
        clip,
        triggerHaptic,
      });
    },
    [entry.id, entry.status, triggerHaptic],
  );

  const handleStripPress = useCallback(() => {
    if (!activeClip) return;
    handlePlayClip(activeClip);
  }, [activeClip, handlePlayClip]);

  if (!activeClip) {
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
        onPress={handleStripPress}
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

      {showChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.echoClipChipScroll}
          contentContainerStyle={styles.echoClipChipRow}
          testID="entry-echo-clip-chips"
        >
          {clips.map((clip, index) => {
            const n = index + 1;
            const trimmedName = clip.name?.trim();
            const label = trimmedName
              ? t("entryCard.echoClipChipNamed", {
                  n,
                  name: truncateClipShortName(trimmedName),
                })
              : t("entryCard.echoClipChip", { n });
            const selected =
              isStripPlaying && currentAudioId === clip.id
                ? true
                : !isStripPlaying && activeClip.id === clip.id;
            return (
              <AppChip
                key={clip.id}
                label={label}
                selected={selected}
                onPress={() => handlePlayClip(clip)}
                testID={`entry-echo-clip-chip-${n}`}
              />
            );
          })}
        </ScrollView>
      ) : null}

      {activeClip.syncStatus === "pending" && (
        <Text style={styles.echoStripFootnote}>
          {tSystem("audio.pendingUpload")}
        </Text>
      )}
      {activeClip.syncStatus === "failed" && (
        <TouchableOpacity
          onPress={() => retryAudioUpload(entry.id, activeClip.id)}
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
