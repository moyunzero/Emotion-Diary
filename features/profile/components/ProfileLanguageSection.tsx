/**
 * 语言偏好设置区
 */

import { Check } from "lucide-react-native";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ProfileSectionHeader } from "@/components/Profile";
import { GroupedSettingsCard } from "@/components/settings";
import type { AppLocale } from "@/i18n/mapDeviceLocale";
import { useThemeStyles } from "@/hooks/useThemeStyles";
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
  const { colors } = useThemeStyles();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height, colors),
    [width, height, colors],
  );
  const checkColor = colors.primaryDark;

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
            <Check size={20} color={checkColor} />
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
            <Check size={20} color={checkColor} />
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
            <Check size={20} color={checkColor} />
          ) : null}
        </Pressable>
      </GroupedSettingsCard>
    </>
  );
}
