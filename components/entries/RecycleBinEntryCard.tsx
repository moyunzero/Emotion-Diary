/**
 * 回收站只读条目卡片（视觉对齐 EntryCard + 全宽双操作栏）
 */

import { MOOD_CONFIG } from "@/constants";
import { getDeadlineLabel, getMoodLabel } from "@/i18n/moodLabels";
import { resolvePeopleLabel, resolveTriggerLabel } from "@/i18n/resolvePresetLabel";
import { useAppStore } from "@/store/useAppStore";
import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { createResponsiveMetrics } from "@/shared/responsive";
import { MoodEntry, MoodLevel } from "@/types";
import { getMoodIcon } from "@/utils/moodIconUtils";
import { Mic } from "lucide-react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export type RecycleBinEntryCardProps = {
  readonly entry: MoodEntry;
  readonly deletedLabel: string;
  readonly isRestoring: boolean;
  readonly isPurging: boolean;
  readonly onRestore: () => void;
  readonly onPurge: () => void;
};

function getMoodBadgeColor(level: MoodLevel): string {
  switch (level) {
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
}

function createRecycleBinEntryCardStyles(width: number, height: number) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize, shadow } = DESIGN_TOKENS;

  return StyleSheet.create({
    wrapper: {
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
    },
    container: {
      backgroundColor: COLORS.background.primary,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      ...shadow.md,
    },
    body: {
      padding: spacing.lg,
    },
    content: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    moodIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    textContainer: {
      flex: 1,
      minWidth: 0,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
      gap: spacing.sm,
    },
    titleText: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: "700",
      color: COLORS.text.primary,
      letterSpacing: -0.3,
    },
    dateText: {
      fontSize: m.fontSize.small,
      color: COLORS.text.tertiary,
      fontWeight: "500",
      flexShrink: 0,
    },
    contentText: {
      fontSize: m.fontSize.body,
      color: COLORS.text.secondary,
      lineHeight: 22,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: spacing.sm,
    },
    deadlineTag: {
      backgroundColor: COLORS.gray[100],
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: 10,
    },
    deadlineText: {
      fontSize: fontSize.xs,
      color: COLORS.text.secondary,
      fontWeight: "600",
    },
    triggerTag: {
      backgroundColor: "#FDF2F8",
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: 10,
    },
    triggerText: {
      fontSize: fontSize.xs,
      color: "#F472B6",
      fontWeight: "600",
    },
    audioTag: {
      backgroundColor: "#EEF2FF",
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    audioTagText: {
      fontSize: fontSize.xs,
      color: "#6C63FF",
      fontWeight: "600",
    },
    actionBar: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.border.light,
      backgroundColor: COLORS.gray[50],
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    actionButtonPressed: {
      backgroundColor: COLORS.gray[100],
    },
    actionButtonDisabled: {
      opacity: 0.45,
    },
    actionDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: COLORS.border.light,
    },
    restoreText: {
      fontSize: fontSize.base,
      color: COLORS.primaryDark,
      fontFamily: "Lato_700Bold",
    },
    purgeText: {
      fontSize: fontSize.base,
      color: COLORS.error,
      fontFamily: "Lato_700Bold",
    },
  });
}

export function RecycleBinEntryCard({
  entry,
  deletedLabel,
  isRestoring,
  isPurging,
  onRestore,
  onPurge,
}: RecycleBinEntryCardProps) {
  const { t } = useTranslation("recycle");
  const effectiveLocale = useAppStore((state) => state.effectiveLocale);
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createRecycleBinEntryCardStyles(width, height),
    [width, height],
  );

  const mood = MOOD_CONFIG[entry.moodLevel];
  const trimmed = entry.content.trim();
  const hasAudio = (entry.audios?.length ?? 0) > 0;
  const isBusy = isRestoring || isPurging;
  const peopleLabel = useMemo(
    () => entry.people?.filter(Boolean).map(resolvePeopleLabel).join(", "),
    [entry.people, effectiveLocale],
  );
  const titleText = peopleLabel || getMoodLabel(entry.moodLevel);
  const deadlineLabel = useMemo(
    () => getDeadlineLabel(entry.deadline),
    [entry.deadline, effectiveLocale],
  );
  const resolvedTriggers = useMemo(
    () => (entry.triggers?.filter(Boolean) ?? []).map(resolveTriggerLabel),
    [entry.triggers, effectiveLocale],
  );

  return (
    <View style={styles.wrapper} testID="recycle-bin-entry-card">
      <View style={styles.container}>
        <View style={styles.body}>
          <View style={styles.content}>
            <View
              style={[
                styles.moodIconBadge,
                { backgroundColor: getMoodBadgeColor(entry.moodLevel) },
              ]}
            >
              {getMoodIcon(mood.iconName, "#FFFFFF", 20)}
            </View>
            <View style={styles.textContainer}>
              <View style={styles.header}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {titleText}
                </Text>
                <Text style={styles.dateText}>
                  {t("card.deletedAtPrefix")} {deletedLabel}
                </Text>
              </View>
              <Text style={styles.contentText} numberOfLines={3} accessibilityLabel={entry.content}>
                {trimmed || t("card.noTextContent")}
              </Text>
              {deadlineLabel || resolvedTriggers.length > 0 || hasAudio ? (
                <View style={styles.tagsContainer}>
                  {deadlineLabel ? (
                    <View style={styles.deadlineTag}>
                      <Text style={styles.deadlineText}>{deadlineLabel}</Text>
                    </View>
                  ) : null}
                  {resolvedTriggers.map((label, index) => (
                    <View
                      key={`${entry.triggers?.[index] ?? label}-${index}`}
                      style={styles.triggerTag}
                    >
                      <Text style={styles.triggerText}>#{label}</Text>
                    </View>
                  ))}
                  {hasAudio ? (
                    <View style={styles.audioTag}>
                      <Mic size={12} color="#6C63FF" />
                      <Text style={styles.audioTagText}>
                        {t("card.audioCount", { count: entry.audios!.length })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.actionBar}>
          <Pressable
            testID="recycle-restore-button"
            style={({ pressed }) => [
              styles.actionButton,
              pressed && !isBusy && styles.actionButtonPressed,
              isBusy && styles.actionButtonDisabled,
            ]}
            onPress={onRestore}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={t("restore.accessibilityLabel")}
            accessibilityState={{ disabled: isBusy, busy: isRestoring }}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={COLORS.primaryDark} />
            ) : (
              <Text style={styles.restoreText}>{t("restore.buttonLabel")}</Text>
            )}
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable
            testID="recycle-purge-button"
            style={({ pressed }) => [
              styles.actionButton,
              pressed && !isBusy && styles.actionButtonPressed,
              isBusy && styles.actionButtonDisabled,
            ]}
            onPress={onPurge}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={t("purge.accessibilityLabel")}
            accessibilityState={{ disabled: isBusy, busy: isPurging }}
          >
            {isPurging ? (
              <ActivityIndicator size="small" color={COLORS.error} />
            ) : (
              <Text style={styles.purgeText}>
                {t("purge.buttonLabel")}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
