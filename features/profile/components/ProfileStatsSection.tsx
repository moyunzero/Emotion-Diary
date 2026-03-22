/**
 * 统计区：ProfileStatCard、CompanionDaysCard
 */

import { View } from "react-native";
import CompanionDaysCard from "@/components/CompanionDaysCard";
import { ProfileStatCard } from "@/components/Profile";
import { profileStyles } from "@/styles/components/Profile.styles";

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
  return (
    <View style={profileStyles.statsContainer}>
      <ProfileStatCard value={entriesCount} label="心事记录" />
      <ProfileStatCard value={weatherScore} label="心情指数" accent />
      <CompanionDaysCard onPress={onCompanionDaysPress} />
    </View>
  );
}
