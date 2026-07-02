import { COLORS } from "@/constants/colors";
import { INSIGHTS_COLORS } from "@/components/Insights/constants";
import type { ShareCardModel } from "@/shared/share/buildShareCardModel";
import { Flame } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

type ShareCardBurnContentProps = {
  model: ShareCardModel;
};

export const ShareCardBurnContent: React.FC<ShareCardBurnContentProps> = ({
  model,
}) => {
  const { t } = useTranslation("share");

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Flame size={32} color={COLORS.ritual.burn} />
        <Text style={styles.title}>{t("canvas.burn.title")}</Text>
      </View>

      <View style={styles.momentZone}>
        <Flame size={48} color={COLORS.ritual.burn} style={styles.decorIcon} />
        <Text style={styles.moment}>{model.closingOrRitualLine}</Text>
      </View>

      {model.userSnippet ? (
        <Text style={styles.snippet}>&ldquo;{model.userSnippet}&rdquo;</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 20,
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
  momentZone: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 24,
  },
  decorIcon: {
    opacity: 0.85,
  },
  moment: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Lato_700Bold",
    color: COLORS.ritual.burn,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  snippet: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Lato_400Regular",
    color: INSIGHTS_COLORS.textSecondary,
    textAlign: "center",
  },
});
