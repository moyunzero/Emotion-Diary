import {
  Cloud,
  CloudRain,
  CloudSnow,
  Flower2,
  Leaf,
  Sprout,
  Sun,
  TreeDeciduous,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, DESIGN_TOKENS } from "../../constants/colors";
import type {
  GrowthStageId,
  ShareCardModel,
} from "../../shared/share/buildShareCardModel";
import type { ExportWeatherBucket } from "../../utils/reviewStatsWeather";
import { INSIGHTS_COLORS } from "../Insights/constants";

export type ShareCardAiStatus = "idle" | "loading" | "ready" | "fallback";

export type ShareCardWeekContentProps = {
  model: ShareCardModel;
  aiStatus: ShareCardAiStatus;
  dateRangeLabel: string;
};

const WEATHER_ICONS: Record<
  ExportWeatherBucket,
  React.ComponentType<{ size: number; color: string }>
> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudSnow,
};

const GROWTH_ICONS: Record<
  GrowthStageId,
  React.ComponentType<{ size: number; color: string }>
> = {
  seed: Sprout,
  sprout: Sprout,
  seedling: Leaf,
  bud: TreeDeciduous,
  bloom: Flower2,
};

function resolveWeatherBucket(
  bucket: ShareCardModel["weatherBucket"],
): ExportWeatherBucket {
  if (
    bucket === "sunny" ||
    bucket === "cloudy" ||
    bucket === "rainy" ||
    bucket === "stormy"
  ) {
    return bucket;
  }
  return "sunny";
}

export const ShareCardWeekContent: React.FC<ShareCardWeekContentProps> = ({
  model,
  aiStatus,
  dateRangeLabel,
}) => {
  const { t } = useTranslation("share");
  const bucket = resolveWeatherBucket(model.weatherBucket);
  const weatherTokens = COLORS.weatherCard[bucket];
  const WeatherIcon = WEATHER_ICONS[bucket];
  const GrowthIcon = GROWTH_ICONS[model.growthStage];

  const narrativeLine =
    model.weatherNarrativeLine.trim() || t("canvas.weatherFallback");

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t("canvas.week.title")}</Text>
      <Text style={styles.dateRange}>{dateRangeLabel}</Text>

      <Text style={styles.sectionLabel}>{t("canvas.weatherLabel")}</Text>
      <View
        style={[styles.weatherZone, { backgroundColor: weatherTokens.bg }]}
      >
        <WeatherIcon size={32} color={weatherTokens.icon} />
        <Text style={[styles.narrative, { color: weatherTokens.text }]}>
          {narrativeLine}
        </Text>
      </View>

      <Text style={styles.sectionLabel}>{t("canvas.gardenLabel")}</Text>
      <View style={styles.gardenZone}>
        <GrowthIcon size={48} color={COLORS.ritual.resolve} />
        <Text style={styles.gardenLabel}>{model.gardenStageLabel}</Text>
      </View>

      <View style={styles.closingZone}>
        {aiStatus === "loading" ? (
          <Text style={styles.aiLoading}>{t("canvas.aiLoading")}</Text>
        ) : null}
        <Text style={styles.closingLine}>{model.closingOrRitualLine}</Text>
        {model.userSnippet ? (
          <Text style={styles.userSnippet}>"{model.userSnippet}"</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  title: {
    fontFamily: "Lato_700Bold",
    fontSize: 20,
    lineHeight: 25,
    color: INSIGHTS_COLORS.text,
  },
  dateRange: {
    marginTop: DESIGN_TOKENS.spacing.xs,
    fontFamily: "Lato_400Regular",
    fontSize: 14,
    lineHeight: 21,
    color: INSIGHTS_COLORS.textSecondary,
  },
  sectionLabel: {
    marginTop: DESIGN_TOKENS.spacing.lg,
    marginBottom: DESIGN_TOKENS.spacing.md,
    fontFamily: "Lato_700Bold",
    fontSize: 12,
    lineHeight: 16.8,
    color: COLORS.text.secondary,
  },
  weatherZone: {
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    padding: DESIGN_TOKENS.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.md,
  },
  narrative: {
    flex: 1,
    fontFamily: "Lato_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  gardenZone: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
  },
  gardenLabel: {
    flex: 1,
    fontFamily: "Lato_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: INSIGHTS_COLORS.text,
  },
  closingZone: {
    marginTop: "auto",
    paddingTop: DESIGN_TOKENS.spacing.lg,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingBottom: DESIGN_TOKENS.spacing.md,
    backgroundColor: `${INSIGHTS_COLORS.primary}18`,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
  },
  aiLoading: {
    fontFamily: "Lato_400Regular",
    fontSize: 12,
    lineHeight: 16.8,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  closingLine: {
    fontFamily: "Lato_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: INSIGHTS_COLORS.text,
  },
  userSnippet: {
    marginTop: DESIGN_TOKENS.spacing.md,
    fontFamily: "Lato_400Regular",
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    color: INSIGHTS_COLORS.textSecondary,
  },
});
