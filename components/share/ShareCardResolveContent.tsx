import { COLORS } from "@/constants/colors";
import { INSIGHTS_COLORS } from "@/components/Insights/constants";
import type { ShareCardModel } from "@/shared/share/buildShareCardModel";
import {
  Flower2,
  Leaf,
  Sprout,
  TreeDeciduous,
  type LucideIcon,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

type ShareCardResolveContentProps = {
  model: ShareCardModel;
};

const STAGE_ICONS: Record<ShareCardModel["growthStage"], LucideIcon> = {
  seed: Sprout,
  sprout: Sprout,
  seedling: Leaf,
  bud: TreeDeciduous,
  bloom: Flower2,
};

export const ShareCardResolveContent: React.FC<ShareCardResolveContentProps> = ({
  model,
}) => {
  const { t } = useTranslation("share");
  const StageIcon = STAGE_ICONS[model.growthStage];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Sprout size={32} color={COLORS.ritual.resolve} />
        <Text style={styles.title}>{t("canvas.resolve.title")}</Text>
      </View>

      <View style={styles.zone}>
        <Text style={styles.zoneLabel}>{t("canvas.weatherLabel")}</Text>
        <Text style={styles.zoneBody}>{model.weatherNarrativeLine}</Text>
      </View>

      <View style={styles.zone}>
        <Text style={styles.zoneLabel}>{t("canvas.gardenLabel")}</Text>
        <View style={styles.gardenRow}>
          <StageIcon size={48} color={COLORS.ritual.resolve} />
          <Text style={styles.gardenLabel}>{model.gardenStageLabel}</Text>
        </View>
      </View>

      <View style={styles.closingZone}>
        <Text style={styles.closing}>{model.closingOrRitualLine}</Text>
        {model.userSnippet ? (
          <Text style={styles.snippet}>&ldquo;{model.userSnippet}&rdquo;</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: "Lato_700Bold",
    color: INSIGHTS_COLORS.text,
  },
  zone: {
    gap: 6,
  },
  zoneLabel: {
    fontSize: 12,
    lineHeight: 16.8,
    fontFamily: "Lato_700Bold",
    color: COLORS.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  zoneBody: {
    fontSize: 15,
    lineHeight: 22.5,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.text,
  },
  gardenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gardenLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22.5,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.text,
  },
  closingZone: {
    marginTop: "auto",
    gap: 8,
  },
  closing: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Lato_700Bold",
    color: COLORS.primaryDark,
  },
  snippet: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.textSecondary,
  },
});
