/**
 * Maestro 015 dev seed — synthetic guest entries + retention dismiss/mock/locale keys.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppLocale } from "@/i18n/mapDeviceLocale";
import {
  getDevRetentionMockNowKey,
  setDevRetentionMockNow,
} from "@/shared/retention/getRetentionNow";
import { setOnboardingMetaphorSeen } from "@/services/onboardingMetaphor";
import {
  saveLocalePreference,
  type LocalePreference,
} from "@/services/localeSettings";
import {
  DEFAULT_EMOTION_REMINDER_SETTINGS,
  type EmotionReminderSettings,
} from "@/services/reminderSettings";
import { saveToStorage } from "@/store/modules/storage";
import { MoodLevel, Status, type MoodEntry } from "@/types";

const GUEST_STORAGE_KEY = "mood_entries_guest";
const DISMISS_REVISIT_KEY = "retention_revisit_dismissed_until";
const DISMISS_WEEKLY_KEY = "retention_weekly_review_dismissed_week";
const REMINDER_STORAGE_KEY = "emotion_reminder_settings_v1";

export type MaestroRetentionScenario = "revisit" | "weekly";
type MaestroReminderPreset = "default" | "daily-on";

export type MaestroRetentionSeedOptions = {
  scenario: MaestroRetentionScenario;
  locale?: AppLocale;
  reminders?: MaestroReminderPreset;
};

function assertScenario(
  scenario: string,
): asserts scenario is MaestroRetentionScenario {
  if (scenario !== "revisit" && scenario !== "weekly") {
    throw new Error(`Unknown retention seed scenario: ${scenario}`);
  }
}

function parseLocale(raw: string | undefined): AppLocale | undefined {
  if (raw === "zh-Hans" || raw === "en-US") {
    return raw;
  }
  return undefined;
}

function parseReminders(
  raw: string | undefined,
): MaestroReminderPreset | undefined {
  if (raw === "default" || raw === "daily-on") {
    return raw;
  }
  return undefined;
}

function makeSeedEntry(
  partial: Partial<MoodEntry> & Pick<MoodEntry, "id" | "timestamp">,
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content ?? "Maestro retention seed",
    deadline: partial.deadline ?? "later",
    people: partial.people ?? [],
    triggers: partial.triggers ?? [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

async function setMaestroLocale(locale: AppLocale): Promise<void> {
  if (!__DEV__) {
    return;
  }
  const preference: LocalePreference = { mode: "manual", locale };
  await saveLocalePreference(preference);
}

async function applyReminderPreset(
  preset: MaestroReminderPreset,
): Promise<void> {
  let settings: EmotionReminderSettings = {
    ...DEFAULT_EMOTION_REMINDER_SETTINGS,
  };
  if (preset === "daily-on") {
    settings = {
      ...DEFAULT_EMOTION_REMINDER_SETTINGS,
      dailyReminderEnabled: true,
    };
  }
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
}

export async function runMaestroRetentionSeed(
  scenarioOrOptions: MaestroRetentionScenario | MaestroRetentionSeedOptions,
): Promise<void> {
  if (!__DEV__) {
    return;
  }

  const options: MaestroRetentionSeedOptions =
    typeof scenarioOrOptions === "string"
      ? { scenario: scenarioOrOptions }
      : scenarioOrOptions;

  assertScenario(options.scenario);
  await setOnboardingMetaphorSeen(true);

  if (options.locale) {
    await setMaestroLocale(options.locale);
  }

  if (options.reminders) {
    await applyReminderPreset(options.reminders);
  } else {
    await applyReminderPreset("default");
  }

  if (options.scenario === "revisit") {
    await AsyncStorage.removeItem(getDevRetentionMockNowKey());
    setDevRetentionMockNow(null);
    await AsyncStorage.removeItem(DISMISS_REVISIT_KEY);

    const entry = makeSeedEntry({
      id: "maestro-retention-revisit",
      timestamp: Date.now() - 3 * 86400000,
    });
    await saveToStorage(GUEST_STORAGE_KEY, [entry]);
    return;
  }

  const mockIso = "2025-03-15T12:00:00";
  await AsyncStorage.setItem(getDevRetentionMockNowKey(), mockIso);
  setDevRetentionMockNow(mockIso);
  await AsyncStorage.removeItem(DISMISS_WEEKLY_KEY);

  const entry = makeSeedEntry({
    id: "maestro-retention-weekly",
    timestamp: new Date("2025-03-14T10:00:00").getTime(),
  });
  await saveToStorage(GUEST_STORAGE_KEY, [entry]);
}

/** Parse dev-seed-retention query params (whitelist validation). */
export function parseMaestroRetentionSeedParams(params: {
  scenario?: string;
  locale?: string;
  reminders?: string;
}): MaestroRetentionSeedOptions | null {
  if (params.scenario !== "revisit" && params.scenario !== "weekly") {
    return null;
  }
  return {
    scenario: params.scenario,
    locale: parseLocale(params.locale),
    reminders: parseReminders(params.reminders),
  };
}
