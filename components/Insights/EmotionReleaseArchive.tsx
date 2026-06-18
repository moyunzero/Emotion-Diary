import { resolveTriggerLabel } from "@/i18n/resolvePresetLabel";
import { Flame, NotebookPen, Wind } from "lucide-react-native";
import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useResponsiveStyles } from "../../hooks/useResponsiveStyles";
import { MoodEntry, Status } from "../../types";
import { formatDateChinese } from "@/shared/formatting";
import { INSIGHTS_COLORS } from "./constants";

interface EmotionReleaseArchiveProps {
  entries: MoodEntry[];
}

const EmotionReleaseArchiveComponent: React.FC<EmotionReleaseArchiveProps> = ({
  entries,
}) => {
  const { t } = useTranslation("insights");
  const responsive = useResponsiveStyles();
  const releaseData = useMemo(() => {
    const burnedEntries = entries
      .filter((entry) => entry.status === Status.BURNED)
      .sort((a, b) => (b.burnedAt || b.timestamp) - (a.burnedAt || a.timestamp));

    const releaseRate = entries.length
      ? Math.round((burnedEntries.length / entries.length) * 100)
      : 0;

    return {
      releaseRate,
      burnedCount: burnedEntries.length,
      latestBurned: burnedEntries[0],
    };
  }, [entries]);

  if (!releaseData.latestBurned) {
    return (
      <View
        style={[
          styles.container,
          {
            marginBottom: responsive.spacing.cardGap,
            padding: responsive.padding.card,
            borderRadius: responsive.borderRadius.card,
          },
        ]}
      >
        <View style={styles.header}>
          <Flame size={20} color="#EA580C" />
          <Text style={[styles.title, { fontSize: responsive.fontSize.cardTitle }]}>
            {t("releaseArchive.title")}
          </Text>
        </View>
        <Text style={[styles.subtitle, { fontSize: responsive.fontSize.small }]}>
          {t("releaseArchive.subtitleEmpty")}
        </Text>
        <View style={styles.emptyCard}>
          <Wind size={28} color="#9CA3AF" />
          <Text
            style={[
              styles.emptyText,
              {
                fontSize: responsive.fontSize.small,
                lineHeight: responsive.fontSize.small + 6,
              },
            ]}
          >
            {t("releaseArchive.empty.text")}
          </Text>
        </View>
      </View>
    );
  }

  const latest = releaseData.latestBurned;
  const reflectionQuestion = latest.triggers[0]
    ? t("releaseArchive.reflectionWithTrigger", {
        trigger: resolveTriggerLabel(latest.triggers[0]),
      })
    : t("releaseArchive.reflectionGeneric");

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: responsive.spacing.cardGap,
          padding: responsive.padding.card,
          borderRadius: responsive.borderRadius.card,
        },
      ]}
    >
      <View style={styles.header}>
        <Flame size={20} color="#EA580C" />
        <Text style={[styles.title, { fontSize: responsive.fontSize.cardTitle }]}>
          {t("releaseArchive.title")}
        </Text>
      </View>
      <Text style={[styles.subtitle, { fontSize: responsive.fontSize.small }]}>
        {t("releaseArchive.subtitleFilled")}
      </Text>

      <View style={styles.metricRow}>
        <View style={styles.metricPill}>
          <Text style={[styles.metricLabel, { fontSize: responsive.fontSize.small - 1 }]}>
            {t("releaseArchive.metrics.releaseRate")}
          </Text>
          <Text style={[styles.metricValue, { fontSize: responsive.fontSize.body }]}>
            {releaseData.releaseRate}%
          </Text>
        </View>
        <View style={styles.metricPill}>
          <Text style={[styles.metricLabel, { fontSize: responsive.fontSize.small - 1 }]}>
            {t("releaseArchive.metrics.burnedCount")}
          </Text>
          <Text style={[styles.metricValue, { fontSize: responsive.fontSize.body }]}>
            {releaseData.burnedCount}
            {t("releaseArchive.metrics.burnedUnit")}
          </Text>
        </View>
      </View>

      <View style={styles.recordCard}>
        <Text style={[styles.recordDate, { fontSize: responsive.fontSize.small - 1 }]}>
          {t("releaseArchive.latestRelease", {
            date: formatDateChinese(latest.burnedAt || latest.timestamp),
          })}
        </Text>
        <Text
          style={[
            styles.recordContent,
            {
              fontSize: responsive.fontSize.body - 1,
              lineHeight: responsive.fontSize.body + 6,
            },
          ]}
          numberOfLines={2}
        >
          &ldquo;{latest.content}&rdquo;
        </Text>
        <View style={styles.questionRow}>
          <NotebookPen size={14} color="#16A34A" />
          <Text
            style={[
              styles.questionText,
              {
                fontSize: responsive.fontSize.small,
                lineHeight: responsive.fontSize.small + 6,
              },
            ]}
          >
            {reflectionQuestion}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: INSIGHTS_COLORS.cardBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: INSIGHTS_COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 28,
    color: INSIGHTS_COLORS.textSecondary,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  metricPill: {
    flex: 1,
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metricLabel: {
    color: "#9A3412",
  },
  metricValue: {
    marginTop: 2,
    fontWeight: "700",
    color: "#C2410C",
  },
  recordCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
  },
  recordDate: {
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: 6,
  },
  recordContent: {
    color: INSIGHTS_COLORS.text,
    marginBottom: 10,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  questionText: {
    flex: 1,
    color: "#166534",
  },
  emptyCard: {
    marginTop: 4,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    textAlign: "center",
    color: INSIGHTS_COLORS.textSecondary,
  },
});

export const EmotionReleaseArchive = memo(EmotionReleaseArchiveComponent);
