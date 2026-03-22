/** 仅供回顾导出 AI 的结构化统计摘要，不包含用户日记原文。 */

import type { MoodEntry } from '../types';
import {
  computeReviewExportDerivedState,
  type ReviewExportClosingSummary,
} from './reviewExportDerived';
import type { ReviewExportPreset } from '@/shared/time-range';

export type { ReviewExportClosingSummary } from './reviewExportDerived';

function normalizeFirstEntryDate(value: number | null): number | null {
  if (value === null) return null;
  return value > 0 ? value : null;
}

export function buildReviewExportClosingSummary(
  entries: MoodEntry[],
  firstEntryDate: number | null,
  preset: ReviewExportPreset,
  now: Date,
): ReviewExportClosingSummary {
  return computeReviewExportDerivedState(
    entries,
    normalizeFirstEntryDate(firstEntryDate),
    preset,
    now,
  )
    .closingSummary;
}
