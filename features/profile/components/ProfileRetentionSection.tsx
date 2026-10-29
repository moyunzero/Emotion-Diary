/**
 * 留存提醒区：每日提醒与每周回顾开关
 */

import { Bell, History } from "lucide-react-native";
import { Switch, Text, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ProfileSectionHeader } from "@/components/Profile";
import { GroupedSettingsCard } from "@/components/settings";
import { COLORS } from "@/constants/colors";
import type { EmotionReminderSettings } from "@/services/reminderSettings";
import { createProfileStyles } from "@/styles/components/Profile.styles";

export type ProfileRetentionSectionProps = {
  reminderSettings: EmotionReminderSettings;
  reminderLoading: boolean;
  reminderSupported: boolean;
  onToggleDailyReminder: () => void;
  onToggleWeeklyReviewNotification: () => void;
  isLoading: boolean;
};

export function ProfileRetentionSection({
  reminderSettings,
  reminderLoading,
  reminderSupported,
  onToggleDailyReminder,
  onToggleWeeklyReviewNotification,
  isLoading,
}: ProfileRetentionSectionProps) {
  const { t: tProfile } = useTranslation("profile");
  const { t: tRetention } = useTranslation("retention");
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );

  return (
    <>
      <ProfileSectionHeader title={tProfile("sections.retention")} />
      <GroupedSettingsCard testID="profile-retention-section">
        <View style={profileStyles.menuItem} testID="profile-daily-reminder-row">
          <View
            style={[
              profileStyles.menuIcon,
              { backgroundColor: COLORS.mood.level1 },
            ]}
          >
            <Bell size={20} color={COLORS.brandPressed} />
          </View>
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tRetention("dailyReminder.title")}
            </Text>
            <Text
              style={profileStyles.menuSubtext}
              testID="profile-daily-reminder-subtext"
            >
              {reminderSupported
                ? reminderSettings.dailyReminderEnabled
                  ? tRetention("dailyReminder.subtextEnabled", {
                      hour: String(reminderSettings.dailyReminderHour).padStart(
                        2,
                        "0",
                      ),
                      minute: String(
                        reminderSettings.dailyReminderMinute,
                      ).padStart(2, "0"),
                    })
                  : tRetention("dailyReminder.subtextDisabled")
                : tRetention("webReminderUnsupported")}
            </Text>
          </View>
          {reminderSupported ? (
            <Switch
              value={reminderSettings.dailyReminderEnabled}
              onValueChange={() => onToggleDailyReminder()}
              disabled={isLoading || reminderLoading}
              trackColor={{ false: COLORS.gray[200], true: COLORS.brandSoft }}
              thumbColor={
                reminderSettings.dailyReminderEnabled
                  ? COLORS.brandPressed
                  : COLORS.gray[100]
              }
            />
          ) : null}
        </View>
        {reminderSupported && reminderSettings.dailyReminderEnabled ? (
          <>
            <View style={profileStyles.menuDivider} />
            <View style={profileStyles.menuItem} testID="profile-weekly-review-row">
              <View
                style={[
                  profileStyles.menuIcon,
                  { backgroundColor: COLORS.atmosphere.rainy },
                ]}
              >
                <History size={20} color={COLORS.brandPressed} />
              </View>
              <View style={profileStyles.menuTextContainer}>
                <Text style={profileStyles.menuText}>
                  {tRetention("weeklyReview.toggleTitle")}
                </Text>
                <Text
                  style={profileStyles.menuSubtext}
                  testID="profile-weekly-review-subtext"
                >
                  {tRetention("weeklyReview.toggleSubtext")}
                </Text>
              </View>
              <Switch
                value={reminderSettings.weeklyReviewNotificationEnabled}
                onValueChange={() => onToggleWeeklyReviewNotification()}
                disabled={isLoading || reminderLoading}
                trackColor={{ false: COLORS.gray[200], true: COLORS.brandSoft }}
                thumbColor={
                  reminderSettings.weeklyReviewNotificationEnabled
                    ? COLORS.brandPressed
                    : COLORS.gray[100]
                }
              />
            </View>
          </>
        ) : null}
      </GroupedSettingsCard>
    </>
  );
}
