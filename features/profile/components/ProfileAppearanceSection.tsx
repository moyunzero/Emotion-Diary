/**
 * 外观偏好设置区
 */

import { Check } from "lucide-react-native";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ProfileSectionHeader } from "@/components/Profile";
import { GroupedSettingsCard } from "@/components/settings";
import type {
  AppearanceMode,
  AppearancePreference,
  ResolvedScheme,
} from "@/services/appearanceSettings";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import { useThemeStyles } from "@/hooks/useThemeStyles";

export type ProfileAppearanceSectionProps = {
  appearancePreference: AppearancePreference;
  effectiveColorScheme: ResolvedScheme;
  onSetAppearanceMode: (mode: AppearanceMode) => Promise<void>;
};

export function ProfileAppearanceSection({
  appearancePreference,
  onSetAppearanceMode,
}: ProfileAppearanceSectionProps) {
  const { t: tProfile } = useTranslation("profile");
  const { width, height } = useWindowDimensions();
  const { colors } = useThemeStyles();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );

  const checkColor = colors.primaryDark;

  return (
    <>
      <ProfileSectionHeader title={tProfile("appearance.sectionTitle")} />
      <Text style={[profileStyles.menuSubtext, { marginBottom: 8, marginLeft: 4 }]}>
        {tProfile("appearance.hint")}
      </Text>
      <GroupedSettingsCard>
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetAppearanceMode("system")}
          testID="profile-appearance-system"
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("appearance.options.followSystem")}
            </Text>
          </View>
          {appearancePreference.mode === "system" ? (
            <Check size={20} color={checkColor} />
          ) : null}
        </Pressable>
        <View style={profileStyles.menuDivider} />
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetAppearanceMode("light")}
          testID="profile-appearance-light"
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("appearance.options.light")}
            </Text>
          </View>
          {appearancePreference.mode === "light" ? (
            <Check size={20} color={checkColor} />
          ) : null}
        </Pressable>
        <View style={profileStyles.menuDivider} />
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetAppearanceMode("night")}
          testID="profile-appearance-night"
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("appearance.options.night")}
            </Text>
          </View>
          {appearancePreference.mode === "night" ? (
            <Check size={20} color={checkColor} />
          ) : null}
        </Pressable>
      </GroupedSettingsCard>
    </>
  );
}
