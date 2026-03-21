import { Deadline, MoodLevel, Status } from '../../../types';
import {
  getTopThreeWeatherBucketsByDays,
  moodLevelToExportWeatherBucket,
} from '../../../utils/reviewStatsWeather';

const entry = (
  id: string,
  ts: number,
  level: MoodLevel,
): import('../../../types').MoodEntry => ({
  id,
  timestamp: ts,
  moodLevel: level,
  content: '',
  deadline: Deadline.TODAY,
  people: [],
  triggers: [],
  status: Status.ACTIVE,
});

describe('reviewStatsWeather', () => {
  it('maps mood levels to export buckets', () => {
    expect(moodLevelToExportWeatherBucket(MoodLevel.ANNOYED)).toBe('sunny');
    expect(moodLevelToExportWeatherBucket(MoodLevel.UPSET)).toBe('cloudy');
    expect(moodLevelToExportWeatherBucket(MoodLevel.ANGRY)).toBe('rainy');
    expect(moodLevelToExportWeatherBucket(MoodLevel.FURIOUS)).toBe('stormy');
    expect(moodLevelToExportWeatherBucket(MoodLevel.EXPLOSIVE)).toBe('stormy');
  });

  it('counts bucket days by max mood per day', () => {
    const day1 = new Date(2025, 4, 10, 10, 0, 0, 0).getTime();
    const day2 = new Date(2025, 4, 11, 10, 0, 0, 0).getTime();
    const start = new Date(2025, 4, 10, 0, 0, 0, 0).getTime();
    const end = new Date(2025, 4, 11, 23, 59, 59, 999).getTime();
    const entries = [
      entry('a', day1, MoodLevel.ANNOYED),
      entry('b', day2, MoodLevel.FURIOUS),
    ];
    const top = getTopThreeWeatherBucketsByDays(entries, start, end);
    const sunny = top.find((t) => t.bucket === 'sunny');
    const stormy = top.find((t) => t.bucket === 'stormy');
    expect(sunny?.days).toBe(1);
    expect(stormy?.days).toBe(1);
  });
});
