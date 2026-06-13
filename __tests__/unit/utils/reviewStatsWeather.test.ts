import { MoodLevel, Status, type MoodEntry } from '../../../types';
import {
  countWeatherBucketDaysByMaxMood,
  moodLevelToExportWeatherBucket,
} from '../../../utils/reviewStatsWeather';

function makeEntry(
  partial: Partial<MoodEntry> & { id: string; timestamp: number },
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: '',
    deadline: 'later',
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

describe('reviewStatsWeather', () => {
  it('moodLevelToExportWeatherBucket maps levels', () => {
    expect(moodLevelToExportWeatherBucket(MoodLevel.ANNOYED)).toBe('sunny');
    expect(moodLevelToExportWeatherBucket(MoodLevel.UPSET)).toBe('cloudy');
    expect(moodLevelToExportWeatherBucket(MoodLevel.ANGRY)).toBe('rainy');
    expect(moodLevelToExportWeatherBucket(MoodLevel.FURIOUS)).toBe('stormy');
  });

  it('countWeatherBucketDaysByMaxMood uses max mood per day', () => {
    const day = new Date('2025-03-10T15:00:00');
    const start = new Date('2025-03-10T00:00:00').getTime();
    const end = new Date('2025-03-10T23:59:59').getTime();
    const entries = [
      makeEntry({
        id: '1',
        timestamp: day.getTime(),
        moodLevel: MoodLevel.ANNOYED,
      }),
      makeEntry({
        id: '2',
        timestamp: day.getTime() + 3600_000,
        moodLevel: MoodLevel.FURIOUS,
      }),
    ];
    const counts = countWeatherBucketDaysByMaxMood(entries, start, end);
    expect(counts.stormy).toBe(1);
    expect(counts.sunny).toBe(0);
  });

  it('ignores soft-deleted entries', () => {
    const ts = new Date('2025-03-11T12:00:00').getTime();
    const start = new Date('2025-03-11T00:00:00').getTime();
    const end = new Date('2025-03-11T23:59:59').getTime();
    const entries = [
      makeEntry({
        id: '1',
        timestamp: ts,
        deletedAt: ts,
        moodLevel: MoodLevel.FURIOUS,
      }),
    ];
    const counts = countWeatherBucketDaysByMaxMood(entries, start, end);
    expect(counts.stormy).toBe(0);
  });
});
