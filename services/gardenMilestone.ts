/**
 * Garden milestone seen/pending persistence (NAR-02, D-05/D-07/D-08)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TFunction } from 'i18next';
import { getGrowthStage } from '../components/Insights/utils';
import { excludeSoftDeletedEntries } from '../shared/entries/visibility';
import { MoodEntry, Status } from '../types';

export const GARDEN_MILESTONE_V1_SEEN_PREFIX = 'garden_milestone_v1_seen_';
export const GARDEN_MILESTONE_V1_PENDING = 'garden_milestone_v1_pending';

export type GrowthStageId = 'seed' | 'sprout' | 'seedling' | 'bud' | 'bloom';

export type PendingMilestone = {
  stage: GrowthStageId;
};

const STAGE_RANK: Record<GrowthStageId, number> = {
  seed: 0,
  sprout: 1,
  seedling: 2,
  bud: 3,
  bloom: 4,
};

const noopT = ((key: string) => key) as TFunction<'insights'>;

export function getGrowthStageRank(stage: GrowthStageId): number {
  return STAGE_RANK[stage];
}

export function computeResolveRate(entries: readonly MoodEntry[]): number {
  const visible = excludeSoftDeletedEntries([...entries]);
  if (visible.length === 0) {
    return 0;
  }
  const resolved = visible.filter((e) => e.status === Status.RESOLVED).length;
  return resolved / visible.length;
}

export function detectStageCrossing(
  beforeRate: number,
  afterRate: number,
): GrowthStageId | null {
  const beforeStage = getGrowthStage(beforeRate, noopT).stage as GrowthStageId;
  const afterStage = getGrowthStage(afterRate, noopT).stage as GrowthStageId;

  if (afterStage === 'seed') {
    return null;
  }

  const beforeRank = getGrowthStageRank(beforeStage);
  const afterRank = getGrowthStageRank(afterStage);

  if (afterRank > beforeRank) {
    return afterStage;
  }
  return null;
}

export async function isStageSeen(stage: GrowthStageId): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(
      `${GARDEN_MILESTONE_V1_SEEN_PREFIX}${stage}`,
    );
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function markStageSeen(stage: GrowthStageId): Promise<boolean> {
  try {
    await AsyncStorage.setItem(
      `${GARDEN_MILESTONE_V1_SEEN_PREFIX}${stage}`,
      'true',
    );
    return true;
  } catch {
    return false;
  }
}

export async function setPendingMilestone(
  stage: GrowthStageId,
): Promise<boolean> {
  try {
    const payload: PendingMilestone = { stage };
    await AsyncStorage.setItem(
      GARDEN_MILESTONE_V1_PENDING,
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}

export async function loadPendingMilestone(): Promise<PendingMilestone | null> {
  try {
    const raw = await AsyncStorage.getItem(GARDEN_MILESTONE_V1_PENDING);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PendingMilestone;
  } catch {
    return null;
  }
}

export async function clearPendingMilestone(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(GARDEN_MILESTONE_V1_PENDING);
    return true;
  } catch {
    return false;
  }
}

export async function maybeSetPendingAfterResolve(
  entriesBefore: readonly MoodEntry[],
  entriesAfter: readonly MoodEntry[],
): Promise<boolean> {
  const beforeRate = computeResolveRate(entriesBefore);
  const afterRate = computeResolveRate(entriesAfter);
  const newStage = detectStageCrossing(beforeRate, afterRate);
  if (!newStage) {
    return false;
  }
  if (await isStageSeen(newStage)) {
    return false;
  }
  return setPendingMilestone(newStage);
}
