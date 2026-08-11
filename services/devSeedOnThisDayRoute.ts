/**
 * __DEV__ On This Day seed route body — extracted for unit tests + rejection safety.
 */

import {
  parseMaestroOnThisDaySeedParams,
  runMaestroOnThisDaySeed,
} from '@/services/maestroOnThisDaySeed';
import { logger } from '@/utils/logger';

export type DevSeedOnThisDayDeps = {
  scenario?: string | string[];
  locale?: string | string[];
  getUserId: () => string | null;
  setEntries: (entries: Awaited<ReturnType<typeof runMaestroOnThisDaySeed>>) => void;
  loadEntries: () => Promise<void>;
  setLocale: (locale: 'zh-Hans' | 'en-US') => Promise<void>;
  replace: (href: string) => void;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse → seed → hydrate → navigate. Invalid params → `/`.
 * Any rejection → log + navigate `/` (safe fallback).
 */
export async function executeDevSeedOnThisDayRoute(
  deps: DevSeedOnThisDayDeps,
): Promise<void> {
  try {
    const seedOptions = parseMaestroOnThisDaySeedParams({
      scenario: firstParam(deps.scenario),
      locale: firstParam(deps.locale),
    });
    if (!seedOptions) {
      deps.replace('/');
      return;
    }

    const userId = deps.getUserId();
    const seeded = await runMaestroOnThisDaySeed({
      ...seedOptions,
      userId,
    });
    if (seeded.length > 0) {
      deps.setEntries(seeded);
    } else {
      await deps.loadEntries();
    }

    if (seedOptions.locale) {
      await deps.setLocale(seedOptions.locale);
    }

    deps.replace('/on-this-day');
  } catch (error) {
    logger.error('DevSeedOnThisDay', 'seed route failed', error);
    deps.replace('/');
  }
}
