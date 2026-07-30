import { COLORS } from "@/constants/colors";
import { i18n } from "@/i18n";
import { audioCoordinator } from "@/shared/audio/coordinator";
import { Mic, Pause, Play } from "lucide-react-native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, TouchableOpacity, View } from "react-native";
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
  const playbackPosition = useAppStore((s) =>
    s.playbackEntryId === entryId ? s.playbackPosition : 0,
  );
  const retryAudioUpload = useAppStore((state) => state.retryAudioUpload);

  return {
    currentAudioId,
    isPlayingGlobal,
    playbackPosition,
    retryAudioUpload,
  };
}

function useAudioRowRenderer(
  entry: MoodEntry,
  styles: ReturnType<typeof createEntryCardStyles>,
) {
  const { t: tSystem } = useTranslation("system");
  const { t: tRecord } = useTranslation("record");
  const {
    currentAudioId,
    isPlayingGlobal,
    playbackPosition,
    retryAudioUpload,
  } = useEntryCardPlaybackState(entry.id);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isAudioRowActive = useCallback(
    (audio: AudioData) => currentAudioId === audio.id,
    [currentAudioId],
  );

  const handlePlayAudio = useCallback(
    async (audio: AudioData) => {
      try {
        const result = await audioCoordinator.playEntryAudio(entry.id, audio);
        if (!result.ok && result.reason === "no_uri") {
          Alert.alert(
            i18n.t("alerts.playbackFailed.title", { ns: "dashboard" }),
            i18n.t("alerts.playbackFailed.bodyMissing", { ns: "dashboard" }),
          );
        } else if (!result.ok) {
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
    [entry.id],
  );

  const formatAudioTime = useCallback((createdAt: number): string => {
    const locale = i18n.language.startsWith("zh") ? "zh-CN" : "en-US";
    return new Date(createdAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getAudioDisplayLabel = useCallback(
    (audio: AudioData): string =>
      audio.name ||
      tRecord("audio.list.recordedAt", {
        time: formatAudioTime(audio.createdAt),
      }),
    [formatAudioTime, tRecord],
  );

  const renderAudioRow = useCallback(
    (audio: AudioData) => (
      <View key={audio.id} style={styles.audioPlayRow}>
        <TouchableOpacity
          style={[
            styles.audioPlayItem,
            isAudioRowActive(audio) && styles.audioPlayItemActive,
          ]}
          onPress={() => handlePlayAudio(audio)}
          accessibilityRole="button"
          accessibilityLabel={tRecord("audio.list.playA11y", {
            label: getAudioDisplayLabel(audio),
          })}
          testID="entry-audio-play"
        >
          {isAudioRowActive(audio) && isPlayingGlobal ? (
            <Pause size={16} color={COLORS.audio.primary} />
          ) : (
            <Play size={16} color="#9CA3AF" />
          )}
          <Text
            style={[
              styles.audioPlayName,
              isAudioRowActive(audio) && styles.audioPlayNameActive,
            ]}
            numberOfLines={1}
          >
            {getAudioDisplayLabel(audio)}
          </Text>
          {isAudioRowActive(audio) && isPlayingGlobal && (
            <Text style={styles.audioPlayDuration} testID="entry-audio-playing">
              {formatDuration(playbackPosition)} /{" "}
              {formatDuration(audio.duration)}
            </Text>
          )}
        </TouchableOpacity>
        {audio.syncStatus === "pending" && (
          <View style={styles.audioSyncMeta}>
            <Text style={styles.audioSyncPending}>
              {tSystem("audio.pendingUpload")}
            </Text>
          </View>
        )}
        {audio.syncStatus === "failed" && (
          <TouchableOpacity
            style={styles.audioSyncMeta}
            onPress={() => retryAudioUpload(entry.id, audio.id)}
            accessibilityRole="button"
            accessibilityLabel={tSystem("audio.retryUploadA11y")}
          >
            <Text style={styles.audioSyncFailed}>
              {tSystem("audio.uploadFailedRetry")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [
      entry.id,
      getAudioDisplayLabel,
      handlePlayAudio,
      isAudioRowActive,
      isPlayingGlobal,
      playbackPosition,
      retryAudioUpload,
      styles,
      tRecord,
      tSystem,
    ],
  );

  return renderAudioRow;
}

/** Collapsed/expanded mic tag in the tags row */
export function EntryCardAudioTag({
  entry,
  styles,
}: Pick<EntryCardPlaybackProps, "entry" | "styles">) {
  const { t: tSystem } = useTranslation("system");

  if (!entry.audios || entry.audios.length === 0) {
    return null;
  }

  return (
    <View style={styles.audioTag} testID="entry-has-audio">
      <Mic size={12} color={COLORS.audio.primary} />
      <Text style={styles.audioTagText}>
        {tSystem("audio.voiceCount", {
          count: entry.audios.length,
        })}
      </Text>
    </View>
  );
}

/** Expanded voice playback section on active cards */
export function EntryCardPlayback({
  entry,
  styles,
  isExpanded,
}: EntryCardPlaybackProps) {
  const { t: tSystem } = useTranslation("system");
  const renderAudioRow = useAudioRowRenderer(entry, styles);

  if (!isExpanded || !entry.audios || entry.audios.length === 0) {
    return null;
  }

  return (
    <View style={styles.audioPlaySection}>
      <Text style={styles.audioPlaySectionTitle}>
        {tSystem("audio.voicePlaySection")}
      </Text>
      {entry.audios.map((audio) => renderAudioRow(audio))}
    </View>
  );
}

/** Voice playback list on burned (ash) cards when expanded */
export function EntryCardBurnedPlayback({
  entry,
  styles,
  isExpanded,
}: EntryCardBurnedPlaybackProps) {
  const { t } = useTranslation("dashboard");
  const renderAudioRow = useAudioRowRenderer(entry, styles);

  if (!isExpanded || !entry.audios || entry.audios.length === 0) {
    return null;
  }

  return (
    <View style={styles.burnedAudioContainer}>
      <Text style={styles.burnedAudioLabel}>
        {t("entryCard.burnedAudioLabel")}
      </Text>
      {entry.audios.map((audio) => renderAudioRow(audio))}
    </View>
  );
}
