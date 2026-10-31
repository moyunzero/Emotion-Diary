import { EditEntryModal } from "@/components/entries";
import { COLORS } from "@/constants/colors";
import { i18n } from "@/i18n";
import { getDeadlineLabel } from "@/i18n/moodLabels";
import {
  resolvePeopleLabel,
  resolveTriggerLabel,
} from "@/i18n/resolvePresetLabel";
import { toIntlLocale } from "@/shared/formatting";
import {
  inkProgressRatio,
  moodLevelToWeatherStripKey,
} from "@/shared/mood/weatherStrip";
import { useRecyclingState } from "@shopify/flash-list";
import { SkImage, Skia } from "@shopify/react-native-skia";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { MOOD_CONFIG } from "../../constants";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useAppStore } from "../../store/useAppStore";
import { createEntryCardStyles } from "../../styles/components/EntryCard.styles";
import { MoodEntry, MoodLevel, Status } from "../../types";
import {
  areAudioDataArraysEqual,
  areOrderedStringArraysEqual,
} from "../../utils/arrayEquality";
import { confirmAlert } from "../../utils/confirmAlert";
import { isLowEndDevice } from "../../utils/devicePerformance";
import { getMoodIcon } from "../../utils/moodIconUtils";
import AshIcon from "../AshIcon";
import BurnAnimation from "../BurnAnimation";
import ResolveCeremonyHost from "../rituals/ResolveCeremonyHost";
import ResolveConfirmOverlay from "../rituals/ResolveConfirmOverlay";
import BurnConfirmOverlay from "../rituals/BurnConfirmOverlay";
import { EntryCardActions } from "./EntryCardActions";
import {
  EntryCardPlayback,
  EntryCardSmokeStrip,
} from "./EntryCardPlayback";

type ResolvePhase = "idle" | "confirm" | "ceremony";

interface EntryCardProps {
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
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createEntryCardStyles(width, height),
    [width, height],
  );
  const effectiveLocale = useAppStore((state) => state.effectiveLocale);
  const resolveEntry = useAppStore((state) => state.resolveEntry);
  const burnEntry = useAppStore((state) => state.burnEntry);
  const deleteEntry = useAppStore((state) => state.deleteEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  // FlashList v2：展开变高必须通知列表，否则下方播放行可能画得出但点不着
  const [isExpanded, setIsExpanded] = useRecyclingState(false, [entry.id]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const weatherBreathOpacity = useRef(new Animated.Value(1)).current;
  const isResolved = entry.status === Status.RESOLVED;
  const isBurned = entry.status === Status.BURNED;

  // Gated playback chrome (Pitfall 4) — inactive cards skip position ticks
  const isThisEntryPlaying = useAppStore(
    (s) => s.playbackEntryId === entry.id && s.isPlaying,
  );
  const playbackPosition = useAppStore((s) =>
    s.playbackEntryId === entry.id ? s.playbackPosition : 0,
  );
  const playbackDuration = useAppStore((s) =>
    s.playbackEntryId === entry.id ? s.duration : 0,
  );

  const moodConfig =
    MOOD_CONFIG[entry.moodLevel] || MOOD_CONFIG[MoodLevel.ANNOYED];
  const deadlineLabel = useMemo(
    () => getDeadlineLabel(entry.deadline),
    [entry.deadline, effectiveLocale],
  );
  const resolvedPeopleLabels = useMemo(
    () => (entry.people ?? []).map(resolvePeopleLabel),
    [entry.people, effectiveLocale],
  );
  const resolvedTriggerLabels = useMemo(
    () => (entry.triggers ?? []).map((raw) => resolveTriggerLabel(raw)),
    [entry.triggers, effectiveLocale],
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

  const weatherStripColor =
    COLORS.weather[moodLevelToWeatherStripKey(entry.moodLevel)].icon;
  const hasVisiblePreview = entry.content.trim().length > 0;
  const inkRatio =
    !isBurned && isThisEntryPlaying && hasVisiblePreview
      ? inkProgressRatio(playbackPosition, playbackDuration)
      : 0;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        /* ignore */
      });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Weather strip opacity breath ~1.6s while playing; Reduce Motion → static (D-04 / D-06)
  useEffect(() => {
    if (isBurned || !isThisEntryPlaying || reduceMotion) {
      weatherBreathOpacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(weatherBreathOpacity, {
          toValue: 0.45,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(weatherBreathOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      weatherBreathOpacity.setValue(1);
    };
  }, [isBurned, isThisEntryPlaying, reduceMotion, weatherBreathOpacity]);

  // Burning effect state
  const viewRef = useRef<View>(null);
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [isBurning, setIsBurning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [useSimpleAnimation, setUseSimpleAnimation] = useState(false);
  const [resolvePhase, setResolvePhase] = useState<ResolvePhase>("idle");
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);

  const handleResolvePress = () => {
    triggerHaptic("light");
    setResolvePhase("confirm");
  };

  const handleResolveConfirm = () => {
    setResolvePhase("ceremony");
  };

  const handleResolveCancel = () => {
    setResolvePhase("idle");
  };

  const handleResolveCeremonyComplete = () => {
    resolveEntry(entry.id);
    setResolvePhase("idle");
    setIsExpanded(false);
  };

  /** D-32: if this entry is playing, stop immediately when burn proceeds. */
  const stopPlaybackIfThisEntry = () => {
    const state = useAppStore.getState();
    if (state.playbackEntryId === entry.id) {
      state.stopAudio();
    }
  };

  const handleBurnComplete = () => {
    triggerHaptic("success");
    stopPlaybackIfThisEntry();
    burnEntry(entry.id);
    onBurn?.(entry.id);
    setIsBurning(false);
    setSnapshot(null);
    setUseSimpleAnimation(false);
    setIsExpanded(false);
  };

  const handleDelete = () => {
    void (async () => {
      const confirmed = await confirmAlert({
        title: i18n.t("alerts.moveToRecycle.title", { ns: "dashboard" }),
        message: i18n.t("alerts.moveToRecycle.message", {
          ns: "dashboard",
          excerpt: contentExcerpt,
        }),
        confirmLabel: i18n.t("alerts.moveToRecycle.confirm", {
          ns: "dashboard",
        }),
        cancelLabel: i18n.t("actions.cancel", { ns: "common" }),
        destructive: true,
      });
      if (!confirmed) return;
      triggerHaptic("error");
      deleteEntry(entry.id);
      setIsExpanded(false);
    })();
  };

  const startBurnAnimation = async () => {
    setIsPreparing(true);
    triggerHaptic("medium");

    const isLowEnd = await isLowEndDevice();

    if (isLowEnd) {
      setUseSimpleAnimation(true);
      setIsBurning(true);
      triggerHaptic("light");
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
          triggerHaptic("light");
          setIsPreparing(false);
        } else {
          setUseSimpleAnimation(true);
          setIsBurning(true);
          triggerHaptic("light");
          setIsPreparing(false);
        }
      } catch (e) {
        console.error("Burn effect failed:", e);
        stopPlaybackIfThisEntry();
        burnEntry(entry.id);
        setIsPreparing(false);
      }
    }, 50);
  };

  const handleBurnPress = () => {
    if (isPreparing) return;
    triggerHaptic("light");
    setShowBurnConfirm(true);
  };

  const handleBurnConfirm = () => {
    setShowBurnConfirm(false);
    stopPlaybackIfThisEntry();
    void startBurnAnimation();
  };

  const handleBurnCancel = () => {
    setShowBurnConfirm(false);
  };

  // 彻底删除灰烬（只对已焚烧的卡片显示）
  const handleDeleteAsh = () => {
    void (async () => {
      const confirmed = await confirmAlert({
        title: i18n.t("alerts.deleteAsh.title", { ns: "dashboard" }),
        message: i18n.t("alerts.deleteAsh.message", { ns: "dashboard" }),
        confirmLabel: i18n.t("alerts.deleteAsh.confirm", { ns: "dashboard" }),
        cancelLabel: i18n.t("actions.cancel", { ns: "common" }),
        destructive: true,
      });
      if (!confirmed) return;
      triggerHaptic("error");
      deleteEntry(entry.id);
    })();
  };

  /** Card chrome: time-of-day only (D-37) — day headers own the date. */
  const formatEntryTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString(toIntlLocale(effectiveLocale), {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isBurning && useSimpleAnimation) {
    return (
      <SimpleBurnAnimation onComplete={handleBurnComplete}>
        <View style={styles.wrapper}>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.moodIconBadge}>
                {getMoodIcon(moodConfig.iconName, COLORS.brand, 20)}
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

  // 灰烬状态卡片
  if (isBurned) {
    return (
      <View style={styles.wrapper} testID="mood-entry-card">
        <View style={[styles.container, styles.burnedContainer]}>
          <TouchableOpacity
            onPress={() => {
              ensureLayoutAnimationEnabled();
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setIsExpanded(!isExpanded);
            }}
            onLongPress={handleDeleteAsh}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === "deleteAsh") {
                handleDeleteAsh();
              }
            }}
            accessibilityActions={[
              {
                name: "deleteAsh",
                label: t("entryCard.deleteAshAction"),
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            activeOpacity={0.8}
          >
            <View style={styles.content}>
              {/* 灰烬图标 */}
              <View style={[styles.moodIconBadge, styles.ashIconBadge]}>
                <AshIcon size={24} opacity={0.6} color={COLORS.gray[400]} />
              </View>

              {/* 灰烬内容 */}
              <View style={styles.textContainer}>
                <Text style={styles.burnedTitle}>
                  {t("entryCard.burnedTitle")}
                </Text>
                <Text style={styles.burnedDate}>
                  {t("entryCard.burnedAt", {
                    date: formatEntryTime(entry.burnedAt || entry.timestamp),
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
          {/* Smoke strip collapsed + expanded (D-29 / D-34); no chips */}
          {entry.audios && entry.audios.length > 0 ? (
            <View style={styles.content}>
              <View style={{ width: 44 }} />
              <View style={styles.textContainer}>
                <EntryCardSmokeStrip
                  entry={entry}
                  styles={styles}
                  isExpanded={isExpanded}
                />
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <>
      <View
        style={[styles.wrapper, { position: "relative" }]}
        ref={viewRef}
        collapsable={false}
        testID="mood-entry-card"
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
      >
        <Animated.View
          style={[styles.container, isResolved && styles.resolvedContainer]}
        >
          {/* Left weather strip — breath while playing; Reduce Motion thickens (D-04 / D-06) */}
          <Animated.View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no"
            testID="entry-weather-strip"
            style={[
              styles.weatherStrip,
              { backgroundColor: weatherStripColor },
              isThisEntryPlaying &&
                reduceMotion &&
                styles.weatherStripHighlight,
              !reduceMotion && isThisEntryPlaying
                ? { opacity: weatherBreathOpacity }
                : null,
            ]}
          />
          <TouchableOpacity
            testID="entry-card-pressable"
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
              {/* Mood Icon Badge — icon + name chrome; neutral surface2 face (D-24) */}
              <View style={styles.moodIconBadge}>
                {getMoodIcon(moodConfig.iconName, COLORS.brand, 20)}
              </View>

              {/* Content */}
              <View style={styles.textContainer}>
                <View style={styles.header}>
                  <Text style={styles.peopleText} numberOfLines={1}>
                    {peopleDisplay}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatEntryTime(entry.timestamp)}
                  </Text>
                </View>
                <Text
                  style={styles.contentText}
                  numberOfLines={isExpanded ? undefined : 3}
                  accessibilityLabel={entry.content}
                >
                  {entry.content}
                </Text>
                {/* Rose ink under visible preview only (D-05 / D-11 / D-15); no a11y progress (D-20) */}
                {inkRatio > 0 ? (
                  <View
                    accessible={false}
                    importantForAccessibility="no"
                    testID="entry-ink-progress"
                    style={[
                      styles.inkProgressLine,
                      { width: `${Math.round(inkRatio * 100)}%` },
                    ]}
                  />
                ) : null}

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
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Echo strip outside expand pressable (D-01 / D-42); collapsed + expanded */}
          {entry.audios && entry.audios.length > 0 ? (
            <View style={styles.content}>
              <View style={{ width: 44 }} />
              <View style={styles.textContainer}>
                <EntryCardPlayback
                  entry={entry}
                  styles={styles}
                  isExpanded={isExpanded}
                />
              </View>
            </View>
          ) : null}

          <EntryCardActions
            styles={styles}
            isExpanded={isExpanded}
            isResolved={isResolved}
            isBurned={isBurned}
            isPreparing={isPreparing}
            onEdit={handleEdit}
            onResolvePress={handleResolvePress}
            onBurnPress={handleBurnPress}
            onDelete={handleDelete}
          />
        </Animated.View>

        <ResolveCeremonyHost
          visible={resolvePhase === "ceremony"}
          onComplete={handleResolveCeremonyComplete}
        />
      </View>

      <ResolveConfirmOverlay
        visible={resolvePhase === "confirm"}
        onConfirm={handleResolveConfirm}
        onCancel={handleResolveCancel}
      />

      <BurnConfirmOverlay
        visible={showBurnConfirm}
        onConfirm={handleBurnConfirm}
        onCancel={handleBurnCancel}
      />

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
const areEntryCardPropsEqual = (
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
      !areOrderedStringArraysEqual(
        prevProps.entry.people,
        nextProps.entry.people,
      )
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
      !areAudioDataArraysEqual(prevProps.entry.audios, nextProps.entry.audios)
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
