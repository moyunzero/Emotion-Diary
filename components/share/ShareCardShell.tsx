import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, DESIGN_TOKENS } from "../../constants/colors";
import { INSIGHTS_COLORS } from "../Insights/constants";
import type { ShareCardModel } from "../../shared/share/buildShareCardModel";
import {
  SHARE_CARD_ASPECT_RATIO,
  SHARE_CARD_HEIGHT_PX,
  SHARE_CARD_WIDTH_PX,
  toLogicalSize,
} from "../../shared/share/shareCardDimensions";

export type ShareCardShellProps = {
  model: ShareCardModel;
  children: React.ReactNode;
};

export const ShareCardShell: React.FC<ShareCardShellProps> = ({
  model,
  children,
}) => {
  const { t } = useTranslation("share");
  const logical = toLogicalSize(SHARE_CARD_WIDTH_PX, SHARE_CARD_HEIGHT_PX);

  const watermarkText = model.footerDate
    ? t("watermark.withDate", {
        brand: t("watermark.brand"),
        date: model.footerDate,
      })
    : t("watermark.brand");

  return (
    <View
      testID="share-card-canvas"
      collapsable={false}
      accessible
      accessibilityLabel={t("a11y.canvas")}
      style={[
        styles.shell,
        {
          width: "100%",
          maxWidth: logical.width,
          aspectRatio: SHARE_CARD_ASPECT_RATIO,
        },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.body}>{children}</View>
        <View style={styles.footerSlot}>
          <View style={styles.footerRule} />
          <Text style={styles.watermark} numberOfLines={2}>
            {watermarkText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: INSIGHTS_COLORS.cardBg,
    borderWidth: 1,
    borderColor: `${INSIGHTS_COLORS.primary}28`,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  inner: {
    flex: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: DESIGN_TOKENS.spacing.lg,
    paddingBottom: DESIGN_TOKENS.spacing.sm,
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  footerSlot: {
    flexShrink: 0,
    paddingTop: DESIGN_TOKENS.spacing.sm,
    paddingBottom: DESIGN_TOKENS.spacing.xs,
  },
  footerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${INSIGHTS_COLORS.primary}30`,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  watermark: {
    fontSize: 11,
    lineHeight: 15.4,
    fontFamily: "Lato_400Regular",
    color: COLORS.text.secondary,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
