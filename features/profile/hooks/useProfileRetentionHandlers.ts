/**
 * Profile 情绪提醒设置（A1）
 */

import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

import { RETENTION_COPY } from "@/constants/retentionCopy";
import {
  applyEmotionReminderSchedule,
  requestReminderPermissions,
} from "@/services/emotionReminders";
import {
  type EmotionReminderSettings,
  DEFAULT_EMOTION_REMINDER_SETTINGS,
  loadEmotionReminderSettings,
  saveEmotionReminderSettings,
} from "@/services/reminderSettings";
import type { ToastState } from "./useProfileScreenState";

export function useProfileRetentionHandlers(setToast: (v: ToastState) => void) {
  const [reminderSettings, setReminderSettings] =
    useState<EmotionReminderSettings>(DEFAULT_EMOTION_REMINDER_SETTINGS);
  const [reminderLoading, setReminderLoading] = useState(true);

  useEffect(() => {
    loadEmotionReminderSettings()
      .then(setReminderSettings)
      .finally(() => setReminderLoading(false));
  }, []);

  const persistSettings = useCallback(
    async (next: EmotionReminderSettings) => {
      setReminderSettings(next);
      await saveEmotionReminderSettings(next);
      await applyEmotionReminderSchedule(next);
    },
    [],
  );

  const toggleDailyReminder = useCallback(async () => {
    if (reminderSettings.dailyReminderEnabled) {
      await persistSettings({
        ...reminderSettings,
        dailyReminderEnabled: false,
        weeklyReviewNotificationEnabled: false,
      });
      return;
    }

    const confirmEnable = await new Promise<boolean>((resolve) => {
      Alert.alert(
        RETENTION_COPY.enableConfirmTitle,
        RETENTION_COPY.enableConfirmMessage,
        [
          {
            text: RETENTION_COPY.enableConfirmCancel,
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: RETENTION_COPY.enableConfirmOk,
            onPress: () => resolve(true),
          },
        ],
      );
    });

    if (!confirmEnable) return;

    const perm = await requestReminderPermissions();
    if (!perm.ok) {
      setToast({
        message: perm.message ?? RETENTION_COPY.permissionDenied,
        type: "info",
      });
      return;
    }

    await persistSettings({
      ...reminderSettings,
      dailyReminderEnabled: true,
    });
    setToast({ message: "已开启情绪记录提醒", type: "success" });
  }, [reminderSettings, persistSettings, setToast]);

  const toggleWeeklyReviewNotification = useCallback(async () => {
    if (!reminderSettings.dailyReminderEnabled) {
      setToast({
        message: "请先开启情绪记录提醒",
        type: "info",
      });
      return;
    }

    if (!reminderSettings.weeklyReviewNotificationEnabled) {
      const perm = await requestReminderPermissions();
      if (!perm.ok) {
        setToast({
          message: perm.message ?? RETENTION_COPY.permissionDenied,
          type: "info",
        });
        return;
      }
    }

    await persistSettings({
      ...reminderSettings,
      weeklyReviewNotificationEnabled:
        !reminderSettings.weeklyReviewNotificationEnabled,
    });
  }, [reminderSettings, persistSettings, setToast]);

  const reminderSupported = Platform.OS !== "web";

  return {
    reminderSettings,
    reminderLoading,
    reminderSupported,
    toggleDailyReminder,
    toggleWeeklyReviewNotification,
  };
}
