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
  cardTitle: string;
  closingSectionLabel: string;
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
  cardTitle,
  closingSectionLabel,
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
      <View style={styles.headerBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {cardTitle}
        </Text>
        <Text style={styles.dateRange} numberOfLines={1}>
          {dateRangeLabel}
        </Text>
      </View>

      <View style={styles.sections}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("canvas.weatherLabel")}</Text>
          <View
            style={[styles.weatherZone, { backgroundColor: weatherTokens.bg }]}
          >
            <View style={styles.weatherIconWrap}>
              <WeatherIcon size={22} color={weatherTokens.icon} />
            </View>
            <Text
              style={[styles.narrative, { color: weatherTokens.text }]}
              numberOfLines={3}
            >
              {narrativeLine}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("canvas.gardenLabel")}</Text>
          <View style={styles.gardenZone}>
            <View style={styles.gardenIconWrap}>
              <GrowthIcon size={28} color={COLORS.ritual.resolve} />
            </View>
            <Text style={styles.gardenLabel} numberOfLines={1}>
              {model.gardenStageLabel}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{closingSectionLabel}</Text>
          <View style={styles.closingZone}>
            {aiStatus === "loading" ? (
              <Text style={styles.aiLoading}>{t("canvas.aiLoading")}</Text>
            ) : null}
            <Text style={styles.closingLine}>{model.closingOrRitualLine}</Text>
            {model.userSnippet ? (
              <View style={styles.snippetWrap}>
                <Text style={styles.userSnippet}>{model.userSnippet}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  headerBlock: {
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  title: {
    fontFamily: "Lato_700Bold",
    fontSize: 20,
    lineHeight: 27,
    color: INSIGHTS_COLORS.text,
  },
  dateRange: {
    marginTop: 4,
    fontFamily: "Lato_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: INSIGHTS_COLORS.textSecondary,
  },
  sections: {
    flex: 1,
    minHeight: 0,
    gap: DESIGN_TOKENS.spacing.sm + 2,
  },
  section: {
    flexShrink: 0,
  },
  sectionLabel: {
    marginBottom: DESIGN_TOKENS.spacing.xs,
    fontFamily: "Lato_700Bold",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: COLORS.text.secondary,
  },
  weatherZone: {
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_TOKENS.spacing.sm,
  },
  weatherIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
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
    gap: DESIGN_TOKENS.spacing.sm,
    paddingVertical: DESIGN_TOKENS.spacing.xs,
  },
  gardenIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.ritual.resolve}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  gardenLabel: {
    flex: 1,
    fontFamily: "Lato_700Bold",
    fontSize: 16,
    lineHeight: 24,
    color: INSIGHTS_COLORS.text,
  },
  closingZone: {
    alignSelf: "stretch",
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    backgroundColor: `${INSIGHTS_COLORS.primary}12`,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${INSIGHTS_COLORS.primary}25`,
  },
  aiLoading: {
    fontFamily: "Lato_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: DESIGN_TOKENS.spacing.xs,
  },
  closingLine: {
    fontFamily: "Lato_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: INSIGHTS_COLORS.text,
  },
  snippetWrap: {
    marginTop: DESIGN_TOKENS.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primaryLight,
    paddingLeft: DESIGN_TOKENS.spacing.sm,
  },
  userSnippet: {
    fontFamily: "Lato_400Regular",
    fontSize: 15,
    lineHeight: 22,
    fontStyle: "italic",
    color: INSIGHTS_COLORS.textSecondary,
  },
});
