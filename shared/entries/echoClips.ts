/**
 * Echo strip multi-clip helpers (ECHO-02).
 * Pure — no RN / i18n side effects.
 *
 * UX A1 (2026-10-31): progressive disclosure — N>1 can show a segment
 * picker, but labels use 「第 N 段」/ Clip N (not 「声」); chip row is
 * opt-in in the UI, not always-on.
 */

import type { AudioData } from '../../types';

export type EchoClipLocale = 'zh-Hans' | 'en-US';

const DEFAULT_SHORT_NAME_GRAPHEMES = 12;

/** Sort clips by createdAt ascending; first = default play target. */
export function sortClipsAscending(
  clips: readonly AudioData[],
): AudioData[] {
  return [...clips].sort((a, b) => a.createdAt - b.createdAt);
}

/** N>1 may offer a segment picker; N≤1 does not. */
export function needsClipChips(clipCount: number): boolean {
  return clipCount > 1;
}

/** Truncate user clip name to ~max graphemes with ellipsis. */
export function truncateClipShortName(
  name: string,
  maxGraphemes: number = DEFAULT_SHORT_NAME_GRAPHEMES,
): string {
  const graphemes = [...name];
  if (graphemes.length <= maxGraphemes) return name;
  return `${graphemes.slice(0, maxGraphemes).join('')}…`;
}

/**
 * Chip label: named → short name only; unnamed → 「第 N 段」 / Clip N.
 */
export function chipLabel(
  n: number,
  name?: string,
  locale: EchoClipLocale = 'zh-Hans',
): string {
  const trimmed = name?.trim();
  if (trimmed) return truncateClipShortName(trimmed);
  return locale === 'en-US' ? `Clip ${n}` : `第 ${n} 段`;
}
