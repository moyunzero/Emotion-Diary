import { useResponsiveStyles } from "@/hooks/useResponsiveStyles";
import { entriesOnThisDayPriorYears } from "@/shared/entries/onThisDay";
import type { MoodEntry } from "@/types";
import { type Href, useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { INSIGHTS_COLORS } from "../Insights/constants";

type OnThisDayInsightsCardProps = {
  readonly entries: MoodEntry[];
};

/**
 * Insights deferred entry for Memory Lane → `/on-this-day` (REL-05 / D-01).
 * Path-only navigation; optional count via entriesOnThisDayPriorYears only.
 */
function OnThisDayInsightsCardComponent({
  entries,
}: OnThisDayInsightsCardProps) {
  const { t } = useTranslation("onThisDay");
  const router = useRouter();
  const { padding, spacing, borderRadius } = useResponsiveStyles();

  const hintCount = useMemo(
    () => entriesOnThisDayPriorYears(entries, Date.now()).length,
    [entries],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: INSIGHTS_COLORS.cardBg,
          marginBottom: spacing.cardGap,
          padding: padding.card,
          borderRadius: borderRadius.card,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
          minHeight: 44,
        },
        cardPressed: {
          opacity: 0.88,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        },
        iconChip: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(134, 239, 172, 0.22)",
        },
        copy: {
          flex: 1,
          gap: 4,
        },
        title: {
          fontSize: 16,
          fontWeight: "700",
          lineHeight: 20,
          color: INSIGHTS_COLORS.text,
        },
        hint: {
          fontSize: 14,
          fontWeight: "400",
          lineHeight: 20,
          color: INSIGHTS_COLORS.textSecondary,
        },
        cta: {
          marginTop: 8,
          fontSize: 14,
          fontWeight: "700",
          lineHeight: 20,
          color: "#FB7185",
        },
      }),
    [padding, spacing, borderRadius],
  );

  const hint =
    hintCount > 0
      ? t("insightsCard.hintCount", { n: hintCount })
      : t("insightsCard.hint");

  return (
    <Pressable
      testID="on-this-day-insights-card"
      accessibilityRole="button"
      accessibilityLabel={t("a11y.open")}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push("/on-this-day" as unknown as Href)}
    >
      <View style={styles.row}>
        <View style={styles.iconChip}>
          <Sparkles size={22} color={INSIGHTS_COLORS.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{t("insightsCard.title")}</Text>
          <Text style={styles.hint} numberOfLines={2}>
            {hint}
          </Text>
          <Text style={styles.cta}>{t("insightsCard.cta")} →</Text>
        </View>
      </View>
    </Pressable>
  );
}

export const OnThisDayInsightsCard = memo(OnThisDayInsightsCardComponent);
