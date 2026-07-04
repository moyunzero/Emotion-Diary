/**
 * __DEV__ mock "now" for retention touchpoint rules (Maestro 015).
 */

const MOCK_NOW_KEY = "__dev_retention_mock_now_iso";

let devMockNowMs: number | null = null;

/** Hydrate in-memory mock from AsyncStorage (call after cold start in __DEV__). */
export async function hydrateDevRetentionMockNow(): Promise<void> {
  if (!__DEV__) {
    devMockNowMs = null;
    return;
  }
  try {
    const { default: AsyncStorage } = await import(
      "@react-native-async-storage/async-storage"
    );
    const raw = await AsyncStorage.getItem(MOCK_NOW_KEY);
    if (!raw) {
      devMockNowMs = null;
      return;
    }
    const parsed = Date.parse(raw);
    devMockNowMs = Number.isNaN(parsed) ? null : parsed;
  } catch {
    devMockNowMs = null;
  }
}

export function setDevRetentionMockNow(iso: string | null): void {
  if (!__DEV__) {
    return;
  }
  if (iso == null) {
    devMockNowMs = null;
    return;
  }
  const parsed = Date.parse(iso);
  devMockNowMs = Number.isNaN(parsed) ? null : parsed;
}

export function getDevRetentionMockNowKey(): string {
  return MOCK_NOW_KEY;
}

export function getRetentionNow(): Date {
  if (__DEV__ && devMockNowMs != null) {
    return new Date(devMockNowMs);
  }
  return new Date();
}
