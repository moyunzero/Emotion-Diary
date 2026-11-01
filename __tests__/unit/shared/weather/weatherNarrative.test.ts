import zhDashboard from '../../../../locales/zh-Hans/dashboard.json';
import enDashboard from '../../../../locales/en-US/dashboard.json';
import { Deadline, MoodLevel, Status, type MoodEntry } from '../../../../types';
import {
  computeDeadlinePressure,
  computeMoodMix,
  computeWeatherNarrative,
  getWeatherEmptyReason,
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

  describe('getWeatherEmptyReason', () => {
    it('returns noEntries for empty list', () => {
      expect(getWeatherEmptyReason([])).toBe('noEntries');
    });

    it('returns noEntries when only soft-deleted entries exist', () => {
      const entries = [
        makeEntry({ id: 'gone', deletedAt: Date.now() }),
      ];
      expect(getWeatherEmptyReason(entries)).toBe('noEntries');
    });

    it('returns noActive when library has only RESOLVED/BURNED', () => {
      const entries = [
        makeEntry({ id: 'r', status: Status.RESOLVED }),
        makeEntry({ id: 'b', status: Status.BURNED }),
      ];
      expect(getWeatherEmptyReason(entries)).toBe('noActive');
    });

    it('returns null when at least one non-deleted ACTIVE exists', () => {
      const entries = [
        makeEntry({ id: 'a', status: Status.ACTIVE }),
        makeEntry({ id: 'r', status: Status.RESOLVED }),
      ];
      expect(getWeatherEmptyReason(entries)).toBeNull();
    });
  });

  describe('weatherStation.empty locale keys', () => {
    const forbidden = /晴|Sunny|Clear|sunny|本周|this week/i;

    it('zh and en empty keys are non-empty, bilingual, and distinct without sunny claims', () => {
      type EmptyKeys = { noEntries: string; noActive: string };
      const zhEmpty = (
        zhDashboard.weatherStation as { empty?: EmptyKeys }
      ).empty;
      const enEmpty = (
        enDashboard.weatherStation as { empty?: EmptyKeys }
      ).empty;

      expect(zhEmpty).toBeDefined();
      expect(enEmpty).toBeDefined();

      const zhNoEntries = zhEmpty!.noEntries;
      const zhNoActive = zhEmpty!.noActive;
      const enNoEntries = enEmpty!.noEntries;
      const enNoActive = enEmpty!.noActive;

      expect(zhNoEntries.length).toBeGreaterThan(0);
      expect(zhNoActive.length).toBeGreaterThan(0);
      expect(enNoEntries.length).toBeGreaterThan(0);
      expect(enNoActive.length).toBeGreaterThan(0);

      expect(zhNoEntries).not.toBe(enNoEntries);
      expect(zhNoActive).not.toBe(enNoActive);
      expect(zhNoEntries).not.toBe(zhNoActive);
      expect(enNoEntries).not.toBe(enNoActive);

      for (const copy of [zhNoEntries, zhNoActive, enNoEntries, enNoActive]) {
        expect(copy).not.toMatch(forbidden);
      }
    });
  });
});
