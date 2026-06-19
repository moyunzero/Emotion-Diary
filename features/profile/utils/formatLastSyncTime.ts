import type { AppLocale } from "@/i18n/mapDeviceLocale";
import { i18n } from "@/i18n";
import { formatLocaleDate } from "@/shared/formatting";

export function formatLastSyncTimeValue(
  timestamp: number | null,
  effectiveLocale: AppLocale,
  nowMs: number = Date.now(),
): string {
  if (!timestamp) return i18n.t("neverSynced", { ns: "sync" });

  const diff = nowMs - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return i18n.t("justSynced", { ns: "sync" });
  if (minutes < 60) {
    return i18n.t("relative.minutesAgo", { ns: "sync", count: minutes });
  }
  if (hours < 24) {
    return i18n.t("relative.hoursAgo", { ns: "sync", count: hours });
  }
  if (days < 7) {
    return i18n.t("relative.daysAgo", { ns: "sync", count: days });
  }

  return formatLocaleDate(timestamp, effectiveLocale, "short");
}
