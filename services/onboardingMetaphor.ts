/**
 * 首次隐喻 intro 持久化（设备级 global key）与升级 migration
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadFromStorage } from "../store/modules/storage";

export const ONBOARDING_METAPHOR_SEEN_KEY = "onboarding_metaphor_v1_seen";

const LEGACY_ENTRIES_KEY = "mood_entries";
const GUEST_ENTRIES_KEY = "mood_entries_guest";
const USER_SESSION_KEY = "user_session";

let replayListener: (() => void) | null = null;

export async function loadOnboardingMetaphorSeen(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_METAPHOR_SEEN_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export async function setOnboardingMetaphorSeen(seen: boolean): Promise<void> {
  await AsyncStorage.setItem(
    ONBOARDING_METAPHOR_SEEN_KEY,
    seen ? "true" : "false",
  );
}

export function registerOnboardingReplayListener(fn: () => void): void {
  replayListener = fn;
}

export function openOnboardingReplay(): void {
  replayListener?.();
}

/**
 * 升级用户：已有条目或 user_session → 标记 seen，不展示 intro（D-11）
 */
export async function migrateOnboardingMetaphorIfNeeded(): Promise<void> {
  if (await loadOnboardingMetaphorSeen()) {
    return;
  }

  const session = await AsyncStorage.getItem(USER_SESSION_KEY);
  if (session != null) {
    await setOnboardingMetaphorSeen(true);
    return;
  }

  const legacyEntries = await loadFromStorage(LEGACY_ENTRIES_KEY);
  if (legacyEntries.length > 0) {
    await setOnboardingMetaphorSeen(true);
    return;
  }

  const guestEntries = await loadFromStorage(GUEST_ENTRIES_KEY);
  if (guestEntries.length > 0) {
    await setOnboardingMetaphorSeen(true);
    return;
  }

  const allKeys = await AsyncStorage.getAllKeys();
  for (const key of allKeys) {
    if (!key.startsWith("mood_entries_")) {
      continue;
    }
    if (key === GUEST_ENTRIES_KEY) {
      continue;
    }
    const entries = await loadFromStorage(key);
    if (entries.length > 0) {
      await setOnboardingMetaphorSeen(true);
      return;
    }
  }
}
