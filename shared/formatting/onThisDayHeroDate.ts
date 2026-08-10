/**
 * Memory Lane date hero formatter (UI-SPEC Display).
 * Local month-day only — never raw epoch; never slash formatMonthDay.
 */

import type { AppLocale } from '@/i18n/mapDeviceLocale';

/**
 * Format anchorMs as the On This Day hero date string.
 * zh-Hans: 「M 月 D 日」with spaces (UI-SPEC Memory Lane).
 * en-US: locale month-day via Intl (local getters on Date).
 */
export function formatOnThisDayHeroDate(
  anchorMs: number,
  locale: AppLocale,
): string {
  const date = new Date(anchorMs);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (locale === 'zh-Hans') {
    return `${month} 月 ${day} 日`;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}
