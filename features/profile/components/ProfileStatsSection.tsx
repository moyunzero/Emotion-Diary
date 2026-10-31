/**
 * Me stats: one gentle companion / moments line (D-28 / FLOW-06).
 */

import { useCompanionFirstEntryDate } from "@/hooks/useCompanionFirstEntryDate";
import { calculateDays } from "@/services/companionDaysService";
import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

export type ProfileStatsSectionProps = {
  entriesCount: number;
  onCompanionDaysPress: () => void;
};

export function ProfileStatsSection({
  entriesCount,
  onCompanionDaysPress,
}: ProfileStatsSectionProps) {
  const { t } = useTranslation("profile");
  const firstEntryDate = useCompanionFirstEntryDate();
  const days = calculateDays(firstEntryDate);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onCompanionDaysPress}
      accessibilityRole="button"
      accessibilityLabel={t("stats.companionMoments", {
        days,
        entries: entriesCount,
      })}
    >
      <Text style={styles.line}>
        {t("stats.companionMoments", { days, entries: entriesCount })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: DESIGN_TOKENS.spacing.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
  },
  line: {
    fontSize: DESIGN_TOKENS.fontSize.body,
    fontWeight: "400",
    color: COLORS.text.primary,
    lineHeight: 24,
  },
});
