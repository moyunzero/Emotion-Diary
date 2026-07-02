import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, DESIGN_TOKENS } from "../../constants/colors";
import { INSIGHTS_COLORS } from "../Insights/constants";
import type { ShareCardModel, ShareCardVariant } from "../../shared/share/buildShareCardModel";
import {
  SHARE_CARD_ASPECT_RATIO,
  SHARE_CARD_HEIGHT_PX,
  SHARE_CARD_WIDTH_PX,
  toLogicalSize,
} from "../../shared/share/shareCardDimensions";

export type ShareCardShellProps = {
  variant: ShareCardVariant;
  model: ShareCardModel;
  children: React.ReactNode;
};

export const ShareCardShell: React.FC<ShareCardShellProps> = ({
  variant,
  model,
  children,
}) => {
  const { t } = useTranslation("share");
  const logical = toLogicalSize(SHARE_CARD_WIDTH_PX, SHARE_CARD_HEIGHT_PX);
  const accentColor =
    variant === "resolve"
      ? COLORS.ritual.resolve
      : variant === "burn"
        ? COLORS.ritual.burn
        : undefined;

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
          width: logical.width,
          height: logical.height,
          aspectRatio: SHARE_CARD_ASPECT_RATIO,
        },
      ]}
    >
      <View style={styles.inner}>
        {accentColor ? (
          <View
            style={[styles.accentStrip, { backgroundColor: accentColor }]}
          />
        ) : null}
        <View style={styles.content}>{children}</View>
        <Text style={styles.watermark}>{watermarkText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    backgroundColor: INSIGHTS_COLORS.cardBg,
    borderWidth: 1,
    borderColor: `${INSIGHTS_COLORS.primary}35`,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
  },
  inner: {
    flex: 1,
    padding: DESIGN_TOKENS.spacing.xxl,
    flexDirection: "column",
  },
  accentStrip: {
    position: "absolute",
    left: 0,
    top: DESIGN_TOKENS.spacing.xxl,
    bottom: DESIGN_TOKENS.spacing.xxl + 24,
    width: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingLeft: 4,
  },
  watermark: {
    marginTop: DESIGN_TOKENS.spacing.lg,
    fontSize: 12,
    lineHeight: 16.8,
    fontFamily: "Lato_400Regular",
    color: COLORS.text.secondary,
    textAlign: "center",
  },
});
