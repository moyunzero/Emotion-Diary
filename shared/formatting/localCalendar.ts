/**
 * Pure local-calendar day keys — no i18n / RN side effects.
 * Safe for Jest and for utils that must not load the i18n bootstrap.
 */

/** Local calendar day string YYYY-MM-DD (device timezone getters). */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local calendar day key (YYYY-MM-DD); delegates to formatDate. */
export function localDayKey(timestampMs: number): string {
  return formatDate(timestampMs);
}

/** Local month-day key (MM-DD) for On This Day matching — local getters only. */
export function localMonthDayKey(timestampMs: number): string {
  const date = new Date(timestampMs);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}
