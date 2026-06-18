import { EditEntryModal } from "@/components/entries";
import { formatDateChinese } from "@/shared/formatting";
import { audioCoordinator } from "@/shared/audio/coordinator";
import { SkImage, Skia } from "@shopify/react-native-skia";
import { CheckCircle, Edit, Flame, Mic, Pause, Play, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    LayoutAnimation,
    Platform,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    useWindowDimensions,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { useTranslation } from "react-i18next";
import { MOOD_CONFIG } from "../constants";
import { i18n } from "@/i18n";
import { getDeadlineLabel } from "@/i18n/moodLabels";
import {
  resolvePeopleLabel,
  resolveTriggerLabel,
} from "@/i18n/resolvePresetLabel";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useAppStore } from "../store/useAppStore";
import { createEntryCardStyles } from "../styles/components/EntryCard.styles";
import { AudioData, MoodEntry, MoodLevel, Status } from "../types";
import { areAudioDataArraysEqual, areOrderedStringArraysEqual } from "../utils/arrayEquality";
import { isLowEndDevice } from "../utils/devicePerformance";
import { getMoodIcon } from "../utils/moodIconUtils";
import AshIcon from "./AshIcon";
import BurnAnimation from "./BurnAnimation";

export interface EntryCardProps {
  entry: MoodEntry;
  onBurn?: (id: string) => void;
}

// 确保Android LayoutAnimation配置生效（在应用启动时执行）
// 这个配置应该在应用启动时执行一次，但为了确保，我们在使用时也会检查
const ensureLayoutAnimationEnabled = () => {
  if (Platform.OS === "android") {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
};

// 立即执行一次，确保配置生效
ensureLayoutAnimationEnabled();

interface SimpleBurnAnimationProps {
  children: React.ReactNode;
  onComplete: () => void;
}

const SimpleBurnAnimation: React.FC<SimpleBurnAnimationProps> = ({
  children,
  onComplete,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => onCompleteRef.current());
  }, [opacity, scale]);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};

const makeImageFromView = async (
  viewRef: React.RefObject<View | null>,
): Promise<SkImage | null> => {
  try {
    if (!viewRef.current) return null;
    const uri = await captureRef(viewRef.current, {
      format: "png",
      quality: 1,
      result: "base64",
    });
    const data = Skia.Data.fromBase64(uri);
    return Skia.Image.MakeImageFromEncoded(data);
  } catch (e) {
    console.error("Screenshot failed", e);
    return null;
  }
};

/**
 * EntryCard Component
 *
 * Displays a single mood entry with options to edit, resolve, or burn.
 * Uses React.memo with a custom comparison function for performance optimization.
 */
const EntryCardComponent: React.FC<EntryCardProps> = ({ entry, onBurn }) => {
  const { t } = useTranslation("dashboard");
  const { t: tSystem } = useTranslation("system");
  const { t: tRecord } = useTranslation("record");
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createEntryCardStyles(width, height),
    [width, height]
  );
  const resolveEntry = useAppStore((state) => state.resolveEntry);
  const burnEntry = useAppStore((state) => state.burnEntry);
  const deleteEntry = useAppStore((state) => state.deleteEntry);
  const retryAudioUpload = useAppStore((state) => state.retryAudioUpload);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isResolved = entry.status === Status.RESOLVED;
  const isBurned = entry.status === Status.BURNED;

  const moodConfig =
    MOOD_CONFIG[entry.moodLevel] || MOOD_CONFIG[MoodLevel.ANNOYED];
  const deadlineLabel = getDeadlineLabel(entry.deadline);
  const resolvedPeopleLabels = useMemo(
    () => (entry.people ?? []).map(resolvePeopleLabel),
    [entry.people],
  );
  const resolvedTriggerLabels = useMemo(
    () => (entry.triggers ?? []).map(resolveTriggerLabel),
    [entry.triggers],
  );
  const peopleDisplay = resolvedPeopleLabels.join(", ");
  const peopleA11y =
    resolvedPeopleLabels.length > 0
      ? resolvedPeopleLabels.join(t("entryCard.peopleJoiner"))
      : t("entryCard.relatedPersonFallback");
  const contentExcerpt = useMemo(() => {
    const maxLen = 30;
    return `${entry.content.substring(0, maxLen)}${entry.content.length > maxLen ? "..." : ""}`;
  }, [entry.content]);

  // Burning effect state
  const viewRef = useRef<View>(null);
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [isBurning, setIsBurning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [useSimpleAnimation, setUseSimpleAnimation] = useState(false);

  const currentAudioId = useAppStore((s) =>
    s.playbackEntryId === entry.id ? s.currentAudioId : null,
  );
  const isPlayingGlobal = useAppStore(
    (s) => s.playbackEntryId === entry.id && s.isPlaying,
  );
  const playbackPosition = useAppStore((s) =>
    s.playbackEntryId === entry.id ? s.playbackPosition : 0,
  );

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
        >
          {isAudioRowActive(audio) && isPlayingGlobal ? (
            <Pause size={16} color="#6C63FF" />
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
            <Text style={styles.audioPlayDuration}>
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

  const isActivePlaybackEntry = useAppStore(
    (s) => s.playbackEntryId === entry.id,
  );

  useEffect(() => {
    if (!isExpanded && isActivePlaybackEntry) {
      useAppStore.getState().stopAudio();
    }
  }, [isExpanded, isActivePlaybackEntry, entry.id]);

  const handleResolve = () => {
    triggerHaptic("success");
    resolveEntry(entry.id);
    setIsExpanded(false); // 操作完成后折叠卡片
  };

  const handleDelete = () => {
    Alert.alert(
      i18n.t("alerts.moveToRecycle.title", { ns: "dashboard" }),
      i18n.t("alerts.moveToRecycle.message", {
        ns: "dashboard",
        excerpt: contentExcerpt,
      }),
      [
        {
          text: i18n.t("actions.cancel", { ns: "common" }),
          style: "cancel",
        },
        {
          text: i18n.t("alerts.moveToRecycle.confirm", { ns: "dashboard" }),
          style: "destructive",
          onPress: () => {
            triggerHaptic("error");
            deleteEntry(entry.id);
            setIsExpanded(false);
          },
        },
      ],
    );
  };

  const handleBurn = async () => {
    if (isPreparing) return;

    Alert.alert(
      i18n.t("alerts.burn.title", { ns: "dashboard" }),
      i18n.t("alerts.burn.message", { ns: "dashboard" }),
      [
        {
          text: i18n.t("alerts.burn.cancel", { ns: "dashboard" }),
          style: "cancel",
        },
        {
          text: i18n.t("alerts.burn.confirm", { ns: "dashboard" }),
          style: "destructive",
          onPress: async () => {
            setIsPreparing(true);
            triggerHaptic("medium");

            const isLowEnd = await isLowEndDevice();

            if (isLowEnd) {
              setUseSimpleAnimation(true);
              setIsBurning(true);
              setIsPreparing(false);
              return;
            }

            setTimeout(async () => {
              try {
                let image: SkImage | null = null;
                try {
                  image = await makeImageFromView(viewRef);
                } catch (captureError) {
                  console.error("Screenshot capture failed:", captureError);
                  image = null;
                }

                if (image) {
                  setSnapshot(image);
                  setIsBurning(true);
                  setIsPreparing(false);
                } else {
                  setUseSimpleAnimation(true);
                  setIsBurning(true);
                  setIsPreparing(false);
                }
              } catch (e) {
                console.error("Burn effect failed:", e);
                burnEntry(entry.id);
                setIsPreparing(false);
              }
            }, 50);
          },
        },
      ],
    );
  };

  // 彻底删除灰烬（只对已焚烧的卡片显示）
  const handleDeleteAsh = () => {
    Alert.alert(
      i18n.t("alerts.deleteAsh.title", { ns: "dashboard" }),
      i18n.t("alerts.deleteAsh.message", { ns: "dashboard" }),
      [
        {
          text: i18n.t("actions.cancel", { ns: "common" }),
          style: "cancel",
        },
        {
          text: i18n.t("alerts.deleteAsh.confirm", { ns: "dashboard" }),
          style: "destructive",
          onPress: () => {
            triggerHaptic("error");
            deleteEntry(entry.id);
          },
        },
      ],
    );
  };

  const getMoodColor = () => {
    switch (entry.moodLevel) {
      case MoodLevel.ANNOYED:
        return "#FEF3C7";
      case MoodLevel.UPSET:
        return "#FED7AA";
      case MoodLevel.ANGRY:
        return "#FEE2E2";
      case MoodLevel.FURIOUS:
        return "#FECACA";
      case MoodLevel.EXPLOSIVE:
        return "#FCA5A5";
      default:
        return "#FEF3C7";
    }
  };

  // 使用统一的时间戳格式化函数
  const formatEntryDate = (timestamp: number) => {
    return formatDateChinese(timestamp);
  };

  const handleBurnComplete = () => {
    burnEntry(entry.id);
    setIsBurning(false);
    setSnapshot(null);
    setUseSimpleAnimation(false);
  };

  if (isBurning && useSimpleAnimation) {
    return (
      <SimpleBurnAnimation onComplete={handleBurnComplete}>
        <View style={styles.wrapper}>
          <View style={[styles.container, { backgroundColor: "#FEE2E2" }]}>
            <View style={styles.content}>
              <View
                style={[
                  styles.moodIconBadge,
                  { backgroundColor: getMoodColor() },
                ]}
              >
                {getMoodIcon(moodConfig.iconName, "#FFFFFF", 20)}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.contentText} numberOfLines={3}>
                  {entry.content}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SimpleBurnAnimation>
    );
  }

  if (isBurning && snapshot && layout.width > 0 && layout.height > 0) {
    return (
      <View
        style={[styles.wrapper, { width: layout.width, height: layout.height }]}
      >
        <BurnAnimation
          snapshot={snapshot}
          width={layout.width}
          height={layout.height}
          onComplete={handleBurnComplete}
        />
      </View>
    );
  }

  const handleEdit = () => {
    triggerHaptic("light");
    useAppStore.getState().stopAudio();
    setIsEditModalVisible(true);
  };

  // 如果是灰烬状态，渲染灰烬卡片
  if (isBurned) {
    return (
      <View style={styles.wrapper}>
        <TouchableOpacity
          onPress={() => {
            ensureLayoutAnimationEnabled();
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setIsExpanded(!isExpanded);
          }}
          onLongPress={handleDeleteAsh}
          activeOpacity={0.8}
          style={[styles.container, styles.burnedContainer]}
        >
          <View style={styles.content}>
            {/* 灰烬图标 */}
            <View style={[styles.moodIconBadge, styles.ashIconBadge]}>
              <AshIcon size={24} opacity={0.6} color="#9CA3AF" />
            </View>

            {/* 灰烬内容 */}
            <View style={styles.textContainer}>
              <Text style={styles.burnedTitle}>{t("entryCard.burnedTitle")}</Text>
              <Text style={styles.burnedDate}>
                {t("entryCard.burnedAt", {
                  date: formatEntryDate(entry.burnedAt || entry.timestamp),
                })}
              </Text>
              {isExpanded && (
                <View style={styles.burnedContentContainer}>
                  <Text style={styles.burnedContentLabel}>
                    {t("entryCard.burnedContentLabel")}
                  </Text>
                  <Text style={styles.burnedContent}>{entry.content}</Text>
                  <View style={styles.burnedMetaContainer}>
                    <Text style={styles.burnedMeta}>
                      {t("entryCard.burnedMetaPeople", {
                        people: peopleDisplay,
                      })}
                    </Text>
                    <Text style={styles.burnedMeta}>
                      {t("entryCard.burnedMetaTriggers", {
                        triggers: resolvedTriggerLabels
                          .map((label) => `#${label}`)
                          .join(" "),
                      })}
                    </Text>
                  </View>
                  {entry.audios && entry.audios.length > 0 && (
                    <View style={styles.burnedAudioContainer}>
                      <Text style={styles.burnedAudioLabel}>
                        {t("entryCard.burnedAudioLabel")}
                      </Text>
                      {entry.audios.map((audio) => renderAudioRow(audio))}
                    </View>
                  )}
                </View>
              )}
              <Text style={styles.burnedHint}>
                {isExpanded
                  ? t("entryCard.burnedHintExpanded")
                  : t("entryCard.burnedHintCollapsed")}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View
        style={styles.wrapper}
        ref={viewRef}
        collapsable={false}
        testID="mood-entry-card"
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
      >
        <Animated.View
          style={[styles.container, isResolved && styles.resolvedContainer]}
        >
          <TouchableOpacity
            onPress={() => {
              // 确保Android LayoutAnimation配置生效
              ensureLayoutAnimationEnabled();
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setIsExpanded(!isExpanded);
            }}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={t("entryCard.cardA11y", {
              content: entry.content,
              people: peopleA11y,
              expanded: isExpanded
                ? t("entryCard.cardExpanded")
                : t("entryCard.cardCollapsed"),
            })}
            accessibilityHint={
              isExpanded
                ? t("entryCard.cardCollapseHint")
                : t("entryCard.cardExpandHint")
            }
            accessibilityState={{ expanded: isExpanded }}
          >
            <View style={styles.content}>
              {/* Mood Icon Badge */}
              <View
                style={[
                  styles.moodIconBadge,
                  { backgroundColor: getMoodColor() },
                ]}
              >
                {getMoodIcon(moodConfig.iconName, "#FFFFFF", 20)}
              </View>

              {/* Content */}
              <View style={styles.textContainer}>
                <View style={styles.header}>
                  <Text style={styles.peopleText} numberOfLines={1}>
                    {peopleDisplay}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatEntryDate(entry.timestamp)}
                  </Text>
                </View>
                <Text
                  style={styles.contentText}
                  numberOfLines={isExpanded ? undefined : 3}
                  accessibilityLabel={entry.content}
                >
                  {entry.content}
                </Text>

                {/* Tags */}
                <View style={styles.tagsContainer}>
                  <View style={styles.deadlineTag}>
                    <Text style={styles.deadlineText}>{deadlineLabel}</Text>
                  </View>
                  {entry.triggers?.map((trigger, index) => (
                    <View key={trigger} style={styles.triggerTag}>
                      <Text style={styles.triggerText}>
                        #{resolvedTriggerLabels[index] ?? trigger}
                      </Text>
                    </View>
                  ))}
                  {entry.audios && entry.audios.length > 0 && (
                    <View style={styles.audioTag}>
                      <Mic size={12} color="#6C63FF" />
                      <Text style={styles.audioTagText}>
                        {tSystem("audio.voiceCount", {
                          count: entry.audios.length,
                        })}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Audio Playback Section - Only in expanded state */}
                {isExpanded && entry.audios && entry.audios.length > 0 && (
                  <View style={styles.audioPlaySection}>
                    <Text style={styles.audioPlaySectionTitle}>
                      {tSystem("audio.voicePlaySection")}
                    </Text>
                    {entry.audios.map((audio) => renderAudioRow(audio))}
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded Actions */}
          {isExpanded && !isResolved && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
                accessibilityRole="button"
                accessibilityLabel={t("entryCard.editA11y")}
                accessibilityHint={t("entryCard.editHint")}
              >
                <View style={styles.actionIcon}>
                  <Edit size={20} color="#3B82F6" />
                </View>
                <Text style={styles.actionText}>{t("entryCard.edit")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleResolve}
                accessibilityRole="button"
                accessibilityLabel={t("entryCard.resolveA11y")}
                accessibilityHint={t("entryCard.resolveHint")}
              >
                <View style={styles.actionIcon}>
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <Text style={styles.actionText}>{t("entryCard.resolve")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.burnActionButton,
                  isPreparing && { opacity: 0.5 },
                ]}
                onPress={handleBurn}
                disabled={isPreparing}
                accessibilityRole="button"
                accessibilityLabel={t("entryCard.burnA11y")}
                accessibilityHint={t("entryCard.burnHint")}
                accessibilityState={{ disabled: isPreparing }}
              >
                {isPreparing ? (
                  <ActivityIndicator size="small" color="#FF4500" />
                ) : (
                  <>
                    <View style={[styles.actionIcon, styles.burnActionIcon]}>
                      <Flame size={22} color="#FF4500" />
                    </View>
                    <Text style={[styles.actionText, styles.burnActionText]}>
                      {t("entryCard.burn")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
                testID="entry-delete-button"
                accessibilityRole="button"
                accessibilityLabel={t("entryCard.deleteA11y")}
                accessibilityHint={t("entryCard.deleteHint")}
              >
                <View style={styles.actionIcon}>
                  <Trash2 size={18} color="#9CA3AF" />
                </View>
                <Text style={[styles.actionText, styles.deleteActionText]}>
                  {t("entryCard.delete")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>

      {/* 编辑模态框 */}
      <EditEntryModal
        entry={entry}
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          triggerHaptic("success");
          setIsExpanded(false);
        }}
      />
    </>
  );
};

/**
 * Custom comparison function for React.memo optimization.
 * 
 * Performs a deep comparison of EntryCard props to prevent unnecessary re-renders.
 * Specifically handles:
 * - Basic prop comparison (id, status, content, etc.)
 * - Deep equality check for arrays (people, triggers) to handle different references with same content
 * 
 * @param prevProps - Previous props
 * @param nextProps - Next props
 * @returns true if props are equal (no re-render needed), false otherwise
 */
export const areEntryCardPropsEqual = (
  prevProps: EntryCardProps,
  nextProps: EntryCardProps,
) => {
  try {
    // Basic property comparisons
    if (
      prevProps.entry.id !== nextProps.entry.id ||
      prevProps.entry.status !== nextProps.entry.status ||
      prevProps.entry.content !== nextProps.entry.content ||
      prevProps.entry.moodLevel !== nextProps.entry.moodLevel ||
      prevProps.entry.timestamp !== nextProps.entry.timestamp ||
      prevProps.entry.deadline !== nextProps.entry.deadline ||
      prevProps.entry.burnedAt !== nextProps.entry.burnedAt ||
      prevProps.entry.resolvedAt !== nextProps.entry.resolvedAt ||
      prevProps.onBurn !== nextProps.onBurn
    ) {
      return false;
    }

    if (
      !areOrderedStringArraysEqual(prevProps.entry.people, nextProps.entry.people)
    ) {
      return false;
    }

    if (
      !areOrderedStringArraysEqual(
        prevProps.entry.triggers,
        nextProps.entry.triggers,
      )
    ) {
      return false;
    }

    if (
      !areAudioDataArraysEqual(
        prevProps.entry.audios,
        nextProps.entry.audios,
      )
    ) {
      return false;
    }

    // All checks passed - props are equal
    return true;
  } catch (error) {
    console.error("EntryCard memo comparison error:", error);
    // On error, assume props are different (safe default - will re-render)
    return false;
  }
};

// 使用 React.memo 优化性能，避免不必要的重渲染
const EntryCard = React.memo(EntryCardComponent, areEntryCardPropsEqual);

EntryCard.displayName = "EntryCard";

export default EntryCard;
