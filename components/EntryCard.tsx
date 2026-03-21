import { SkImage, Skia } from "@shopify/react-native-skia";
import { CheckCircle, Edit, Flame, Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { DEADLINE_CONFIG, MOOD_CONFIG } from "../constants";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useAppStore } from "../store/useAppStore";
import { styles } from "../styles/components/EntryCard.styles";
import { Deadline, MoodEntry, MoodLevel, Status } from "../types";
import { formatDateChinese } from "../utils/dateUtils";
import { isLowEndDevice } from "../utils/devicePerformance";
import { getMoodIcon } from "../utils/moodIconUtils";
import AshIcon from "./AshIcon";
import BurnAnimation from "./BurnAnimation";
import EditEntryModal from "./EditEntryModal";

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
  const resolveEntry = useAppStore((state) => state.resolveEntry);
  const burnEntry = useAppStore((state) => state.burnEntry);
  const deleteEntry = useAppStore((state) => state.deleteEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isResolved = entry.status === Status.RESOLVED;
  const isBurned = entry.status === Status.BURNED;

  const moodConfig =
    MOOD_CONFIG[entry.moodLevel] || MOOD_CONFIG[MoodLevel.ANNOYED];
  const deadlineLabel =
    DEADLINE_CONFIG[entry.deadline as Deadline]?.label || entry.deadline;

  // Burning effect state
  const viewRef = useRef<View>(null);
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [isBurning, setIsBurning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [useSimpleAnimation, setUseSimpleAnimation] = useState(false);

  const handleResolve = () => {
    triggerHaptic("success");
    resolveEntry(entry.id);
    setIsExpanded(false); // 操作完成后折叠卡片
  };

  const handleDelete = () => {
    Alert.alert(
      "确认删除",
      `确定要删除这条记录吗？\n\n"${entry.content.substring(0, 30)}${entry.content.length > 30 ? "..." : ""}"`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            triggerHaptic("error");
            deleteEntry(entry.id);
            setIsExpanded(false); // 操作完成后折叠卡片
          },
        },
      ],
    );
  };

  const handleBurn = async () => {
    if (isPreparing) return;

    Alert.alert(
      "气话焚烧",
      "真的要烧掉这段记忆吗？\n\n焚烧后会留下灰烬痕迹，但内容将无法恢复。",
      [
        { text: "再想想", style: "cancel" },
        {
          text: "确认焚烧",
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
    Alert.alert("彻底删除", "确定要彻底删除这个灰烬吗？删除后将无法找回。", [
      { text: "取消", style: "cancel" },
      {
        text: "彻底删除",
        style: "destructive",
        onPress: () => {
          triggerHaptic("error");
          deleteEntry(entry.id);
        },
      },
    ]);
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
              <Text style={styles.burnedTitle}>已化作青烟，随风而去</Text>
              <Text style={styles.burnedDate}>
                焚烧于 {formatEntryDate(entry.burnedAt || entry.timestamp)}
              </Text>
              {isExpanded && (
                <View style={styles.burnedContentContainer}>
                  <Text style={styles.burnedContentLabel}>
                    原始内容（仅供回顾）：
                  </Text>
                  <Text style={styles.burnedContent}>{entry.content}</Text>
                  <View style={styles.burnedMetaContainer}>
                    <Text style={styles.burnedMeta}>
                      涉及：{entry.people.join(", ")}
                    </Text>
                    <Text style={styles.burnedMeta}>
                      触发：{entry.triggers.map((t) => `#${t}`).join(" ")}
                    </Text>
                  </View>
                </View>
              )}
              <Text style={styles.burnedHint}>
                {isExpanded
                  ? "点击收起 · 长按彻底删除"
                  : "点击查看原始内容 · 长按彻底删除"}
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
            accessibilityLabel={`情绪记录卡片，涉及${entry.people?.join("和") || "相关人"}，${isExpanded ? "已展开" : "点击展开查看详情"}`}
            accessibilityHint={
              isExpanded ? "点击收起卡片" : "点击展开查看完整内容和操作选项"
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
                    {entry.people?.join(", ") || ""}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatEntryDate(entry.timestamp)}
                  </Text>
                </View>
                <Text
                  style={styles.contentText}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {entry.content}
                </Text>

                {/* Tags */}
                <View style={styles.tagsContainer}>
                  <View style={styles.deadlineTag}>
                    <Text style={styles.deadlineText}>{deadlineLabel}</Text>
                  </View>
                  {entry.triggers?.map((t, index) => (
                    <View key={index} style={styles.triggerTag}>
                      <Text style={styles.triggerText}>#{t}</Text>
                    </View>
                  ))}
                </View>
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
                accessibilityLabel="编辑这条情绪记录"
                accessibilityHint="点击编辑记录的内容、标签或期限"
              >
                <View style={styles.actionIcon}>
                  <Edit size={20} color="#3B82F6" />
                </View>
                <Text style={styles.actionText}>编辑</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleResolve}
                accessibilityRole="button"
                accessibilityLabel="标记为已和解"
                accessibilityHint="点击标记这条情绪记录为已解决，表示已经与相关的人沟通或自己消化"
              >
                <View style={styles.actionIcon}>
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <Text style={styles.actionText}>和解打卡</Text>
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
                accessibilityLabel="气话焚烧"
                accessibilityHint="点击焚烧这条情绪记录，释放负面情绪，内容将无法恢复"
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
                      气话焚烧
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
                accessibilityRole="button"
                accessibilityLabel="删除这条情绪记录"
                accessibilityHint="点击删除这条记录，删除后将无法恢复"
              >
                <View style={styles.actionIcon}>
                  <Trash2 size={18} color="#9CA3AF" />
                </View>
                <Text style={[styles.actionText, styles.deleteActionText]}>
                  删除
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

    // Deep equality check for people array
    const prevPeople = prevProps.entry.people;
    const nextPeople = nextProps.entry.people;

    // Handle null/undefined cases
    if (!prevPeople && !nextPeople) {
      // Both null/undefined - equal
    } else if (!prevPeople || !nextPeople) {
      // One is null/undefined, other is not - not equal
      return false;
    } else if (!Array.isArray(prevPeople) || !Array.isArray(nextPeople)) {
      // One or both are not arrays - not equal
      return false;
    } else if (prevPeople.length !== nextPeople.length) {
      // Different lengths - not equal
      return false;
    } else {
      // Check each element
      for (let i = 0; i < prevPeople.length; i++) {
        if (prevPeople[i] !== nextPeople[i]) {
          return false;
        }
      }
    }

    // Deep equality check for triggers array
    const prevTriggers = prevProps.entry.triggers;
    const nextTriggers = nextProps.entry.triggers;

    // Handle null/undefined cases
    if (!prevTriggers && !nextTriggers) {
      // Both null/undefined - equal
    } else if (!prevTriggers || !nextTriggers) {
      // One is null/undefined, other is not - not equal
      return false;
    } else if (!Array.isArray(prevTriggers) || !Array.isArray(nextTriggers)) {
      // One or both are not arrays - not equal
      return false;
    } else if (prevTriggers.length !== nextTriggers.length) {
      // Different lengths - not equal
      return false;
    } else {
      // Check each element
      for (let i = 0; i < prevTriggers.length; i++) {
        if (prevTriggers[i] !== nextTriggers[i]) {
          return false;
        }
      }
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
