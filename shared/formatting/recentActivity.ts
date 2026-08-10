import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { formatRelativeDayLabel } from './date';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatLocaleMonthDay(timestamp: number, locale: AppLocale): string {
  const date = new Date(timestamp);
  const viaIntl = new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
  }).format(date);

  if (locale === 'zh-Hans' && (!viaIntl.includes('月') || !viaIntl.includes('日'))) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return viaIntl;
}

/**
 * Person Timeline header “most recent activity” label (REL-02 / UI-SPEC).
 * null → emDash; local diffDays 0..6 → relative; ≥7 → locale month-day.
 */
export function formatRecentActivityLabel(
  timestamp: number | null,
  now: Date,
  locale: AppLocale,
  emDash: string,
): string {
  if (timestamp == null) return emDash;

  const diffDays = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(new Date(timestamp))) / DAY_MS,
  );

  if (diffDays >= 0 && diffDays <= 6) {
    return formatRelativeDayLabel(timestamp, now, locale);
  }

  return formatLocaleMonthDay(timestamp, locale);
}
