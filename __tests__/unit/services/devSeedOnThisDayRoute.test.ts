/**
 * DEV seed route — rejection → log + fallback `/`; invalid params → `/`.
 */

jest.mock('@/services/maestroOnThisDaySeed', () => ({
  parseMaestroOnThisDaySeedParams: jest.fn(),
  runMaestroOnThisDaySeed: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { executeDevSeedOnThisDayRoute } from '@/services/devSeedOnThisDayRoute';
import {
  parseMaestroOnThisDaySeedParams,
  runMaestroOnThisDaySeed,
} from '@/services/maestroOnThisDaySeed';
import { logger } from '@/utils/logger';
import { MoodLevel, Status, type MoodEntry } from '@/types';

function makeEntry(id: string): MoodEntry {
  return {
    id,
    timestamp: Date.now(),
    moodLevel: MoodLevel.ANNOYED,
    content: 'seed',
    deadline: 'later',
    people: [],
    triggers: [],
    status: Status.ACTIVE,
  };
}

describe('executeDevSeedOnThisDayRoute', () => {
  beforeEach(() => {
    jest.mocked(parseMaestroOnThisDaySeedParams).mockReset();
    jest.mocked(runMaestroOnThisDaySeed).mockReset();
    jest.mocked(logger.error).mockClear();
  });

  it('replaces to / when params are invalid (no seed)', async () => {
    jest.mocked(parseMaestroOnThisDaySeedParams).mockReturnValue(null);
    const replace = jest.fn();
    await executeDevSeedOnThisDayRoute({
      scenario: 'nope',
      getUserId: () => null,
      setEntries: jest.fn(),
      loadEntries: jest.fn(),
      setLocale: jest.fn(),
      replace,
    });
    expect(runMaestroOnThisDaySeed).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('seeds, hydrates, and navigates to /on-this-day on success', async () => {
    jest.mocked(parseMaestroOnThisDaySeedParams).mockReturnValue({
      scenario: 'list',
      locale: 'en-US',
    });
    const seeded = [makeEntry('a'), makeEntry('b')];
    jest.mocked(runMaestroOnThisDaySeed).mockResolvedValue(seeded);
    const setEntries = jest.fn();
    const setLocale = jest.fn().mockResolvedValue(undefined);
    const replace = jest.fn();

    await executeDevSeedOnThisDayRoute({
      scenario: 'list',
      locale: 'en-US',
      getUserId: () => 'u1',
      setEntries,
      loadEntries: jest.fn(),
      setLocale,
      replace,
    });

    expect(setEntries).toHaveBeenCalledWith(seeded);
    expect(setLocale).toHaveBeenCalledWith('en-US');
    expect(replace).toHaveBeenCalledWith('/on-this-day');
  });

  it('logs and falls back to / when seed rejects', async () => {
    jest.mocked(parseMaestroOnThisDaySeedParams).mockReturnValue({
      scenario: 'list',
    });
    const boom = new Error('seed failed');
    jest.mocked(runMaestroOnThisDaySeed).mockRejectedValue(boom);
    const replace = jest.fn();

    await executeDevSeedOnThisDayRoute({
      scenario: 'list',
      getUserId: () => null,
      setEntries: jest.fn(),
      loadEntries: jest.fn(),
      setLocale: jest.fn(),
      replace,
    });

    expect(logger.error).toHaveBeenCalledWith(
      'DevSeedOnThisDay',
      'seed route failed',
      boom,
    );
    expect(replace).toHaveBeenCalledWith('/');
  });
});
