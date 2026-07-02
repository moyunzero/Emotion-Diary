/**
 * NAR-02: gardenMilestone seen/pending persistence + stage crossing
 */

jest.mock('@/components/Insights/utils', () => ({
  getGrowthStage: (rate: number) => {
    if (rate >= 0.8) {
      return { stage: 'bloom', label: 'bloom', icon: null };
    }
    if (rate >= 0.6) {
      return { stage: 'bud', label: 'bud', icon: null };
    }
    if (rate >= 0.4) {
      return { stage: 'seedling', label: 'seedling', icon: null };
    }
    if (rate >= 0.2) {
      return { stage: 'sprout', label: 'sprout', icon: null };
    }
    return { stage: 'seed', label: 'seed', icon: null };
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodLevel, Status, type MoodEntry } from '@/types';
import {
  GARDEN_MILESTONE_V1_PENDING,
  GARDEN_MILESTONE_V1_SEEN_PREFIX,
  clearPendingMilestone,
  computeResolveRate,
  detectStageCrossing,
  isStageSeen,
  loadPendingMilestone,
  markStageSeen,
  maybeSetPendingAfterResolve,
  setPendingMilestone,
} from '@/services/gardenMilestone';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function makeEntry(
  partial: Partial<MoodEntry> & { id: string },
): MoodEntry {
  return {
    id: partial.id,
    timestamp: partial.timestamp ?? 1000,
    moodLevel: partial.moodLevel ?? MoodLevel.ANNOYED,
    content: partial.content ?? 'x',
    deadline: 'later',
    people: [],
    triggers: [],
    status: partial.status ?? Status.ACTIVE,
    deletedAt: partial.deletedAt,
  };
}

/** Build entries so resolve rate ≈ target (denominator excludes soft-deleted). */
function entriesAtRate(
  resolvedCount: number,
  totalCount: number,
): MoodEntry[] {
  const entries: MoodEntry[] = [];
  for (let i = 0; i < resolvedCount; i++) {
    entries.push(
      makeEntry({ id: `r-${i}`, status: Status.RESOLVED }),
    );
  }
  for (let i = resolvedCount; i < totalCount; i++) {
    entries.push(makeEntry({ id: `a-${i}` }));
  }
  return entries;
}

describe('gardenMilestone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computeResolveRate', () => {
    it('matches Insights: resolved / excludeSoftDeleted denominator', () => {
      const entries = [
        ...entriesAtRate(2, 5),
        makeEntry({ id: 'soft', deletedAt: Date.now() }),
      ];
      expect(computeResolveRate(entries)).toBeCloseTo(0.4);
    });
  });

  describe('detectStageCrossing', () => {
    it('returns sprout when rate crosses 0.19 to 0.21', () => {
      expect(detectStageCrossing(0.19, 0.21)).toBe('sprout');
    });

    it('never returns seed as pending stage', () => {
      expect(detectStageCrossing(0, 0.15)).toBeNull();
    });
  });

  describe('isStageSeen / markStageSeen', () => {
    it('round-trips seen flag per stage key', async () => {
      mockStorage.getItem.mockResolvedValueOnce('true');
      await expect(isStageSeen('sprout')).resolves.toBe(true);

      await markStageSeen('sprout');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        `${GARDEN_MILESTONE_V1_SEEN_PREFIX}sprout`,
        'true',
      );
    });

    it('returns false when AsyncStorage read fails', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('fail'));
      await expect(isStageSeen('bud')).resolves.toBe(false);
    });
  });

  describe('pending milestone blob', () => {
    it('loadPendingMilestone / setPendingMilestone round-trip JSON', async () => {
      await setPendingMilestone('seedling');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        GARDEN_MILESTONE_V1_PENDING,
        JSON.stringify({ stage: 'seedling' }),
      );

      mockStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({ stage: 'seedling' }),
      );
      await expect(loadPendingMilestone()).resolves.toEqual({
        stage: 'seedling',
      });

      await clearPendingMilestone();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        GARDEN_MILESTONE_V1_PENDING,
      );
    });

    it('returns null when AsyncStorage read fails', async () => {
      mockStorage.getItem.mockRejectedValueOnce(new Error('fail'));
      await expect(loadPendingMilestone()).resolves.toBeNull();
    });
  });

  describe('maybeSetPendingAfterResolve', () => {
    it('sets pending when stage rank increases and stage not seen', async () => {
      mockStorage.getItem.mockResolvedValue(null);
      const before = entriesAtRate(1, 10);
      const after = entriesAtRate(2, 10);

      const result = await maybeSetPendingAfterResolve(before, after);

      expect(result).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        GARDEN_MILESTONE_V1_PENDING,
        JSON.stringify({ stage: 'sprout' }),
      );
    });

    it('does not set pending when stage already seen', async () => {
      mockStorage.getItem.mockImplementation(async (key: string) => {
        if (key === `${GARDEN_MILESTONE_V1_SEEN_PREFIX}sprout`) {
          return 'true';
        }
        return null;
      });

      const before = entriesAtRate(1, 10);
      const after = entriesAtRate(2, 10);

      const result = await maybeSetPendingAfterResolve(before, after);

      expect(result).toBe(false);
      expect(mockStorage.setItem).not.toHaveBeenCalledWith(
        GARDEN_MILESTONE_V1_PENDING,
        expect.anything(),
      );
    });
  });
});
