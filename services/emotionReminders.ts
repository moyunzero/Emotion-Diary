/**
 * 本地情绪提醒调度（A1 · expo-notifications；Web 降级）
 * 懒加载 native 模块：旧 dev build 未编入 expo-notifications 时不阻塞启动。
 */

import { Platform } from "react-native";

import { RETENTION_COPY } from "@/constants/retentionCopy";
import { logger } from "@/utils/logger";
import {
  type EmotionReminderSettings,
  loadEmotionReminderSettings,
} from "./reminderSettings";

type ExpoNotifications = typeof import("expo-notifications");

const DAILY_NOTIFICATION_ID = "emotion-daily-reminder";
const WEEKLY_NOTIFICATION_ID = "emotion-weekly-review";

let notificationsModule: ExpoNotifications | null | undefined;
let handlerConfigured = false;

function getNotifications(): ExpoNotifications | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }
  if (Platform.OS === "web") {
    notificationsModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require("expo-notifications") as ExpoNotifications;
  } catch (error) {
    if (__DEV__) {
      logger.warn("emotionReminders", "expo-notifications unavailable", error);
    }
    notificationsModule = null;
  }
  return notificationsModule;
}

export function configureNotificationHandler(): void {
  const Notifications = getNotifications();
  if (!Notifications || handlerConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("emotion-reminders", {
    name: "情绪提醒",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type ReminderPermissionResult =
  | { ok: true }
  | { ok: false; reason: "web" | "denied" | "error" | "unavailable"; message?: string };

export async function requestReminderPermissions(): Promise<ReminderPermissionResult> {
  if (Platform.OS === "web") {
    return { ok: false, reason: "web", message: RETENTION_COPY.webReminderUnsupported };
  }

  const Notifications = getNotifications();
  if (!Notifications) {
    return { ok: false, reason: "unavailable", message: RETENTION_COPY.webReminderUnsupported };
  }

  configureNotificationHandler();
  await ensureAndroidNotificationChannel();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return { ok: true };
  }

  const requested = await Notifications.requestPermissionsAsync();
  if (!requested.granted) {
    return { ok: false, reason: "denied", message: RETENTION_COPY.permissionDenied };
  }

  return { ok: true };
}

async function cancelScheduledReminders(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_NOTIFICATION_ID);
}

export async function applyEmotionReminderSchedule(
  settings: EmotionReminderSettings,
): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications || Platform.OS === "web") return;

  configureNotificationHandler();
  await ensureAndroidNotificationChannel();
  await cancelScheduledReminders();

  if (!settings.dailyReminderEnabled) return;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIFICATION_ID,
    content: {
      title: RETENTION_COPY.dailyNotificationTitle,
      body: RETENTION_COPY.dailyNotificationBody,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.dailyReminderHour,
      minute: settings.dailyReminderMinute,
    },
  });

  if (settings.weeklyReviewNotificationEnabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_NOTIFICATION_ID,
      content: {
        title: RETENTION_COPY.weeklyNotificationTitle,
        body: RETENTION_COPY.weeklyNotificationBody,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 7,
        hour: 10,
        minute: 0,
      },
    });
  }
}

export async function rescheduleEmotionRemindersFromStorage(): Promise<void> {
  const settings = await loadEmotionReminderSettings();
  if (!settings.dailyReminderEnabled) {
    await cancelScheduledReminders();
    return;
  }
  await applyEmotionReminderSchedule(settings);
}
