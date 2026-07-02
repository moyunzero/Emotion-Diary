import { Deadline, MoodLevel, Status, type MoodEntry } from '../../../../types';
import {
  computeDeadlinePressure,
  computeMoodMix,
  computeWeatherNarrative,
} from '../../../../shared/weather/weatherNarrative';

function makeEntry(
  partial: Partial<MoodEntry> & { id: string },
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp ?? 1000,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content ?? 'x',
    deadline: partial.deadline ?? Deadline.LATER,
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

describe('weatherNarrative', () => {
  describe('computeMoodMix', () => {
    it('returns calm for empty active entries', () => {
      expect(computeMoodMix([])).toBe('calm');
    });

    it('returns heavy for high average moodLevel', () => {
      const active = [
        makeEntry({ id: 'a', moodLevel: MoodLevel.EXPLOSIVE }),
        makeEntry({ id: 'b', moodLevel: MoodLevel.FURIOUS }),
      ];
      expect(computeMoodMix(active)).toBe('heavy');
    });
  });

  describe('computeDeadlinePressure', () => {
    it('returns low for empty active entries', () => {
      expect(computeDeadlinePressure([])).toBe('low');
    });

    it('returns high when any entry has Deadline.TODAY', () => {
      const active = [
        makeEntry({ id: 'a', deadline: Deadline.THIS_WEEK }),
        makeEntry({ id: 'b', deadline: Deadline.TODAY }),
      ];
      expect(computeDeadlinePressure(active)).toBe('high');
    });

    it('returns medium when week present without today', () => {
      const active = [
        makeEntry({ id: 'a', deadline: Deadline.LATER }),
        makeEntry({ id: 'b', deadline: Deadline.THIS_WEEK }),
      ];
      expect(computeDeadlinePressure(active)).toBe('medium');
    });
  });

  describe('computeWeatherNarrative', () => {
    it('returns calm/low for empty active entries', () => {
      const result = computeWeatherNarrative([], 'sunny');
      expect(result.moodMix).toBe('calm');
      expect(result.deadlinePressure).toBe('low');
      expect(result.narrativeKey).toBe('weatherNarrative.sunny.calm.low');
      expect(result.adviceKey).toBe('weatherAdvice.sunny');
    });

    it('returns heavy/high for single TODAY moodLevel 5 entry', () => {
      const entries = [
        makeEntry({
          id: 'urgent',
          moodLevel: MoodLevel.EXPLOSIVE,
          deadline: Deadline.TODAY,
        }),
      ];
      const result = computeWeatherNarrative(entries, 'stormy');
      expect(result.moodMix).toBe('heavy');
      expect(result.deadlinePressure).toBe('high');
      expect(result.narrativeKey).toBe(
        'weatherNarrative.stormy.heavy.high',
      );
    });

    it('excludes soft-deleted and non-active entries', () => {
      const entries = [
        makeEntry({ id: 'active', moodLevel: MoodLevel.ANNOYED }),
        makeEntry({
          id: 'deleted',
          moodLevel: MoodLevel.EXPLOSIVE,
          deletedAt: Date.now(),
        }),
        makeEntry({
          id: 'resolved',
          moodLevel: MoodLevel.EXPLOSIVE,
          status: Status.RESOLVED,
        }),
      ];
      const result = computeWeatherNarrative(entries, 'cloudy');
      expect(result.moodMix).toBe('calm');
    });

    it('formats adviceKey for all four conditions', () => {
      for (const condition of ['sunny', 'cloudy', 'rainy', 'stormy'] as const) {
        const result = computeWeatherNarrative([], condition);
        expect(result.adviceKey).toBe(`weatherAdvice.${condition}`);
      }
    });
  });
});
