/**
 * 语言偏好设置区
 */

import { Check } from "lucide-react-native";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ProfileSectionHeader } from "@/components/Profile";
import { GroupedSettingsCard } from "@/components/settings";
import { COLORS } from "@/constants/colors";
import type { AppLocale } from "@/i18n/mapDeviceLocale";
import type {
  LocaleMode,
  LocalePreference,
} from "@/services/localeSettings";
import { createProfileStyles } from "@/styles/components/Profile.styles";

export type ProfileLanguageSectionProps = {
  localePreference: LocalePreference;
  effectiveLocale: AppLocale;
  onSetLocale: (locale: AppLocale) => Promise<void>;
  onSetLocaleMode: (mode: LocaleMode) => Promise<void>;
};

export function ProfileLanguageSection({
  localePreference,
  effectiveLocale,
  onSetLocale,
  onSetLocaleMode,
}: ProfileLanguageSectionProps) {
  const { t: tProfile } = useTranslation("profile");
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );

  return (
    <>
      <ProfileSectionHeader title={tProfile("language.sectionTitle")} />
      <GroupedSettingsCard>
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetLocaleMode("system")}
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("language.options.followSystem")}
            </Text>
          </View>
          {localePreference.mode === "system" ? (
            <Check size={20} color={COLORS.primaryDark} />
          ) : null}
        </Pressable>
        <View style={profileStyles.menuDivider} />
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetLocale("zh-Hans")}
          testID="profile-locale-zh-hans"
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("language.options.zhHans")}
            </Text>
          </View>
          {localePreference.mode === "manual" &&
          effectiveLocale === "zh-Hans" ? (
            <Check size={20} color={COLORS.primaryDark} />
          ) : null}
        </Pressable>
        <View style={profileStyles.menuDivider} />
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetLocale("en-US")}
          testID="profile-locale-en-us"
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("language.options.english")}
            </Text>
          </View>
          {localePreference.mode === "manual" &&
          effectiveLocale === "en-US" ? (
            <Check size={20} color={COLORS.primaryDark} />
          ) : null}
        </Pressable>
      </GroupedSettingsCard>
    </>
  );
}
