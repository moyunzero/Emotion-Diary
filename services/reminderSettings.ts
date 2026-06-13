/**
 * 情绪提醒设置持久化（A1 · 默认关）
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "emotion_reminder_settings_v1";

export const DEFAULT_REMINDER_HOUR = 20;
export const DEFAULT_REMINDER_MINUTE = 0;

export type EmotionReminderSettings = {
  dailyReminderEnabled: boolean;
  dailyReminderHour: number;
  dailyReminderMinute: number;
  weeklyReviewNotificationEnabled: boolean;
};

export const DEFAULT_EMOTION_REMINDER_SETTINGS: EmotionReminderSettings = {
  dailyReminderEnabled: false,
  dailyReminderHour: DEFAULT_REMINDER_HOUR,
  dailyReminderMinute: DEFAULT_REMINDER_MINUTE,
  weeklyReviewNotificationEnabled: false,
};

export async function loadEmotionReminderSettings(): Promise<EmotionReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EMOTION_REMINDER_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<EmotionReminderSettings>;
    return {
      dailyReminderEnabled: parsed.dailyReminderEnabled === true,
      dailyReminderHour:
        typeof parsed.dailyReminderHour === "number"
          ? parsed.dailyReminderHour
          : DEFAULT_REMINDER_HOUR,
      dailyReminderMinute:
        typeof parsed.dailyReminderMinute === "number"
          ? parsed.dailyReminderMinute
          : DEFAULT_REMINDER_MINUTE,
      weeklyReviewNotificationEnabled:
        parsed.weeklyReviewNotificationEnabled === true,
    };
  } catch {
    return { ...DEFAULT_EMOTION_REMINDER_SETTINGS };
  }
}

export async function saveEmotionReminderSettings(
  settings: EmotionReminderSettings,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
