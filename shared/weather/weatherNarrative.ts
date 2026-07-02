import { isSoftDeleted } from '../entries/visibility';
import { Deadline, MoodEntry, Status } from '../../types';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy';
export type MoodMix = 'calm' | 'mixed' | 'heavy';
export type DeadlinePressure = 'low' | 'medium' | 'high';

export type WeatherNarrativeResult = {
  narrativeKey: string;
  adviceKey: string;
  condition: WeatherCondition;
  moodMix: MoodMix;
  deadlinePressure: DeadlinePressure;
};

export function computeMoodMix(active: readonly MoodEntry[]): MoodMix {
  if (active.length === 0) {
    return 'calm';
  }
  const avg =
    active.reduce((sum, entry) => sum + entry.moodLevel, 0) / active.length;
  if (avg <= 2) {
    return 'calm';
  }
  if (avg <= 3.5) {
    return 'mixed';
  }
  return 'heavy';
}

export function computeDeadlinePressure(
  active: readonly MoodEntry[],
): DeadlinePressure {
  if (active.length === 0) {
    return 'low';
  }
  if (active.some((entry) => entry.deadline === Deadline.TODAY)) {
    return 'high';
  }
  if (active.some((entry) => entry.deadline === Deadline.THIS_WEEK)) {
    return 'medium';
  }
  return 'low';
}

export function computeWeatherNarrative(
  entries: readonly MoodEntry[],
  condition: WeatherCondition,
): WeatherNarrativeResult {
  const active = entries.filter(
    (entry) => entry.status === Status.ACTIVE && !isSoftDeleted(entry),
  );
  const moodMix = computeMoodMix(active);
  const deadlinePressure = computeDeadlinePressure(active);

  return {
    narrativeKey: `weatherNarrative.${condition}.${moodMix}.${deadlinePressure}`,
    adviceKey: `weatherAdvice.${condition}`,
    condition,
    moodMix,
    deadlinePressure,
  };
}
