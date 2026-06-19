/**
 * 统计区：ProfileStatCard、CompanionDaysCard
 */

import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import CompanionDaysCard from "@/components/CompanionDaysCard";
import { ProfileStatCard } from "@/components/Profile";
import { createProfileStyles } from "@/styles/components/Profile.styles";

export type ProfileStatsSectionProps = {
  entriesCount: number;
  weatherScore: number;
  onCompanionDaysPress: () => void;
};

export function ProfileStatsSection({
  entriesCount,
  weatherScore,
  onCompanionDaysPress,
}: ProfileStatsSectionProps) {
  const { t } = useTranslation("profile");
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
  return (
    <View style={profileStyles.statsContainer}>
      <ProfileStatCard value={entriesCount} label={t("stats.entriesLabel")} />
      <ProfileStatCard value={weatherScore} label={t("stats.weatherScoreLabel")} accent />
      <CompanionDaysCard onPress={onCompanionDaysPress} />
    </View>
  );
}
