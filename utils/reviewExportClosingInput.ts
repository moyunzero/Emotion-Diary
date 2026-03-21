/** 仅供回顾导出 AI 的结构化统计摘要，不包含用户日记原文。 */

import type { MoodEntry } from '../types';
import {
  computeReviewExportDerivedState,
  type ReviewExportClosingSummary,
} from './reviewExportDerived';
import type { ReviewExportPreset } from './reviewStatsTimeRange';

export type { ReviewExportClosingSummary } from './reviewExportDerived';

export function buildReviewExportClosingSummary(
  entries: MoodEntry[],
  firstEntryDate: number | null,
  preset: ReviewExportPreset,
  now: Date,
): ReviewExportClosingSummary {
  return computeReviewExportDerivedState(entries, firstEntryDate, preset, now)
    .closingSummary;
}
