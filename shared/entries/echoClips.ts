/**
 * Echo strip multi-clip helpers (ECHO-02 / D-21..D-28).
 * Pure — no RN / i18n side effects.
 */

import type { AudioData } from '../../types';

export type EchoClipLocale = 'zh-Hans' | 'en-US';

const DEFAULT_SHORT_NAME_GRAPHEMES = 12;

/** Sort clips by createdAt ascending; first = 第 1 声 default (D-28 / D-21). */
export function sortClipsAscending(
  clips: readonly AudioData[],
): AudioData[] {
  return [...clips].sort((a, b) => a.createdAt - b.createdAt);
}

/** N>1 shows chip row; N≤1 does not (D-26). */
export function needsClipChips(clipCount: number): boolean {
  return clipCount > 1;
}

/** Truncate user clip name to ~max graphemes with ellipsis (D-23). */
export function truncateClipShortName(
  name: string,
  maxGraphemes: number = DEFAULT_SHORT_NAME_GRAPHEMES,
): string {
  const graphemes = [...name];
  if (graphemes.length <= maxGraphemes) return name;
  return `${graphemes.slice(0, maxGraphemes).join('')}…`;
}

/**
 * Chip label: unnamed 「第 N 声」 / Voice N;
 * named 「第 N 声 · {短名}」 with ~12 grapheme truncate (D-23).
 */
export function chipLabel(
  n: number,
  name?: string,
  locale: EchoClipLocale = 'zh-Hans',
): string {
  const base =
    locale === 'en-US' ? `Voice ${n}` : `第 ${n} 声`;
  const trimmed = name?.trim();
  if (!trimmed) return base;
  return `${base} · ${truncateClipShortName(trimmed)}`;
}
