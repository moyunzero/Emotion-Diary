/**
 * 回收站只读条目卡片（视觉对齐 EntryCard + 全宽双操作栏）
 */

import { MOOD_CONFIG } from "@/constants";
import { getDeadlineLabel, getMoodLabel } from "@/i18n/moodLabels";
import { resolvePeopleLabel, resolveTriggerLabel } from "@/i18n/resolvePresetLabel";
import { useAppStore } from "@/store/useAppStore";
import { type ColorPalette, DESIGN_TOKENS } from "@/constants/colors";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { createResponsiveMetrics } from "@/shared/responsive";
import { MoodEntry } from "@/types";
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

function createRecycleBinEntryCardStyles(
  width: number,
  height: number,
  colors: ColorPalette,
) {
  const m = createResponsiveMetrics(width, height);
  const { spacing, borderRadius, fontSize } = DESIGN_TOKENS;

  return StyleSheet.create({
    wrapper: {
      marginHorizontal: spacing.lg,
      marginVertical: spacing.sm,
    },
    container: {
      backgroundColor: colors.background.primary,
      borderRadius: borderRadius.xl,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
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
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface2,
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
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    dateText: {
      fontSize: m.fontSize.small,
      color: colors.text.tertiary,
      fontWeight: "500",
      flexShrink: 0,
    },
    contentText: {
      fontSize: m.fontSize.body,
      color: colors.text.secondary,
      lineHeight: 22,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: spacing.sm,
    },
    deadlineTag: {
      backgroundColor: colors.gray[100],
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    deadlineText: {
      fontSize: fontSize.xs,
      color: colors.text.secondary,
      fontWeight: "600",
    },
    triggerTag: {
      backgroundColor: colors.background.page,
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    triggerText: {
      fontSize: fontSize.xs,
      color: colors.primaryDark,
      fontWeight: "600",
    },
    audioTag: {
      backgroundColor: colors.audio.surface,
      paddingHorizontal: 10,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    audioTagText: {
      fontSize: fontSize.xs,
      color: colors.audio.primary,
      fontWeight: "600",
    },
    actionBar: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border.light,
      backgroundColor: colors.gray[50],
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    actionButtonPressed: {
      backgroundColor: colors.gray[100],
    },
    actionButtonDisabled: {
      opacity: 0.45,
    },
    actionDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.border.light,
    },
    restoreText: {
      fontSize: fontSize.base,
      color: colors.primaryDark,
      fontWeight: '700',
    },
    purgeText: {
      fontSize: fontSize.base,
      color: colors.error,
      fontWeight: '700',
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
  const { colors } = useThemeStyles();
  const styles = useMemo(
    () => createRecycleBinEntryCardStyles(width, height, colors),
    [width, height, colors],
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
    () => (entry.triggers?.filter(Boolean) ?? []).map((raw) => resolveTriggerLabel(raw)),
    [entry.triggers, effectiveLocale],
  );

  return (
    <View style={styles.wrapper} testID="recycle-bin-entry-card">
      <View style={styles.container}>
        <View style={styles.body}>
          <View style={styles.content}>
            <View style={styles.moodIconBadge}>
              {getMoodIcon(mood.iconName, colors.brand, 20)}
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
                      <Mic size={12} color={colors.audio.primary} />
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
              <ActivityIndicator size="small" color={colors.primaryDark} />
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
              <ActivityIndicator size="small" color={colors.error} />
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
