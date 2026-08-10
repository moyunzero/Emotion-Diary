/**
 * Maestro 019 __DEV__ seed — prior-year same MM-DD entries for On This Day UAT.
 * Diary body is never read from deep-link params (T-15-02).
 */

import type { AppLocale } from "@/i18n/mapDeviceLocale";
import {
  saveLocalePreference,
  type LocalePreference,
} from "@/services/localeSettings";
import { setOnboardingMetaphorSeen } from "@/services/onboardingMetaphor";
import { getStorageKey, saveToStorage } from "@/store/modules/storage";
import { MoodLevel, Status, type MoodEntry } from "@/types";

/** Fixed person tag for person-slot UAT (matches 018 garden pot). */
export const MAESTRO_OTD_PERSON = "other";

export type MaestroOnThisDayScenario = "list" | "person";

export type MaestroOnThisDaySeedOptions = {
  scenario: MaestroOnThisDayScenario;
  locale?: AppLocale;
  /** Active session user id; null/undefined → guest key (must match `_loadEntries`). */
  userId?: string | null;
};

function parseLocale(raw: string | undefined): AppLocale | undefined {
  if (raw === "zh-Hans" || raw === "en-US") {
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
    content: partial.content ?? "Maestro on-this-day seed",
    deadline: partial.deadline ?? "later",
    people: partial.people ?? [],
    triggers: partial.triggers ?? [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

function priorYearTimestamps(now: Date): { y1: number; y2: number } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return {
    y1: new Date(y - 1, m, d, 10, 0, 0, 0).getTime(),
    y2: new Date(y - 2, m, d, 11, 0, 0, 0).getTime(),
  };
}

async function setMaestroLocale(locale: AppLocale): Promise<void> {
  if (!__DEV__) {
    return;
  }
  const preference: LocalePreference = { mode: "manual", locale };
  await saveLocalePreference(preference);
}

/**
 * Parse dev-seed-on-this-day query params (whitelist only — T-15-03).
 * Accepts scenario=list|person and optional locale=zh-Hans|en-US.
 */
export function parseMaestroOnThisDaySeedParams(params: {
  scenario?: string;
  locale?: string;
}): MaestroOnThisDaySeedOptions | null {
  if (params.scenario !== "list" && params.scenario !== "person") {
    return null;
  }
  return {
    scenario: params.scenario,
    locale: parseLocale(params.locale),
  };
}

/**
 * Write MoodEntry fixtures for OTD UAT into the active storage key. No-op outside __DEV__.
 * Returns the seeded entries (empty when no-op) so the route can hydrate the store.
 */
export async function runMaestroOnThisDaySeed(
  options: MaestroOnThisDaySeedOptions,
): Promise<MoodEntry[]> {
  if (!__DEV__) {
    return [];
  }

  if (options.scenario !== "list" && options.scenario !== "person") {
    return [];
  }

  await setOnboardingMetaphorSeen(true);

  if (options.locale) {
    await setMaestroLocale(options.locale);
  }

  const { y1, y2 } = priorYearTimestamps(new Date());
  const people =
    options.scenario === "person" ? [MAESTRO_OTD_PERSON] : [];

  const entries: MoodEntry[] = [
    makeSeedEntry({
      id: "maestro-otd-y1",
      timestamp: y1,
      people,
      content: "Maestro OTD prior year",
    }),
    makeSeedEntry({
      id: "maestro-otd-y2",
      timestamp: y2,
      people,
      content: "Maestro OTD two years ago",
    }),
  ];

  const storageKey = getStorageKey(options.userId ?? null);
  await saveToStorage(storageKey, entries);
  return entries;
}
