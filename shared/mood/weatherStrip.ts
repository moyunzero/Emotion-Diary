/**
 * EntryCard left weather strip color key + ink progress (ECHO-02 / A1).
 * Pure — callers resolve COLORS.weather[key].icon (tokens only; no hex here).
 *
 * Locked A1 MoodLevel → weather key:
 * 1 (ANNOYED) → sunny
 * 2 (UPSET) → cloudy
 * 3 (ANGRY) → rainy
 * 4–5 (FURIOUS / EXPLOSIVE) → stormy
 */

import { MoodLevel } from '../../types';

export type WeatherStripKey = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

/**
 * Map diary MoodLevel to COLORS.weather.*.icon key (A1 locked).
 * Never use mood.level* wash for the strip fill.
 */
export function moodLevelToWeatherStripKey(level: MoodLevel): WeatherStripKey {
  switch (level) {
    case MoodLevel.ANNOYED:
      return 'sunny';
    case MoodLevel.UPSET:
      return 'cloudy';
    case MoodLevel.ANGRY:
      return 'rainy';
    case MoodLevel.FURIOUS:
    case MoodLevel.EXPLOSIVE:
    default:
      return 'stormy';
  }
}

/** Clamp playback position / duration to 0..1 for rose ink width (D-05 / D-11). */
export function inkProgressRatio(position: number, duration: number): number {
  if (!(duration > 0) || !Number.isFinite(duration)) return 0;
  if (!Number.isFinite(position) || position <= 0) return 0;
  if (position >= duration) return 1;
  return position / duration;
}
