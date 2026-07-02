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

function milestoneUserSuffix(userId: string | null): string {
  return userId ?? 'guest';
}

export function getMilestoneSeenKey(
  userId: string | null,
  stage: GrowthStageId,
): string {
  return `${GARDEN_MILESTONE_V1_SEEN_PREFIX}${milestoneUserSuffix(userId)}_${stage}`;
}

export function getMilestonePendingKey(userId: string | null): string {
  return `${GARDEN_MILESTONE_V1_PENDING}_${milestoneUserSuffix(userId)}`;
}

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

export async function isStageSeen(
  userId: string | null,
  stage: GrowthStageId,
): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(getMilestoneSeenKey(userId, stage));
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function markStageSeen(
  userId: string | null,
  stage: GrowthStageId,
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(getMilestoneSeenKey(userId, stage), 'true');
    return true;
  } catch {
    return false;
  }
}

export async function setPendingMilestone(
  userId: string | null,
  stage: GrowthStageId,
): Promise<boolean> {
  try {
    const payload: PendingMilestone = { stage };
    await AsyncStorage.setItem(
      getMilestonePendingKey(userId),
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}

export async function loadPendingMilestone(
  userId: string | null,
): Promise<PendingMilestone | null> {
  try {
    const raw = await AsyncStorage.getItem(getMilestonePendingKey(userId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PendingMilestone;
  } catch {
    return null;
  }
}

export async function clearPendingMilestone(
  userId: string | null,
): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(getMilestonePendingKey(userId));
    return true;
  } catch {
    return false;
  }
}

export async function maybeSetPendingAfterResolve(
  userId: string | null,
  entriesBefore: readonly MoodEntry[],
  entriesAfter: readonly MoodEntry[],
): Promise<boolean> {
  const beforeRate = computeResolveRate(entriesBefore);
  const afterRate = computeResolveRate(entriesAfter);
  const newStage = detectStageCrossing(beforeRate, afterRate);
  if (!newStage) {
    return false;
  }
  if (await isStageSeen(userId, newStage)) {
    return false;
  }
  return setPendingMilestone(userId, newStage);
}
