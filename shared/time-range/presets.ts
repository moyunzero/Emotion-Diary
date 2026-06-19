import type { ReviewExportPreset } from './periods';

/** @deprecated Use t('review.presets.*') or computeReviewExportDerivedState locale-aware presetLabel */
export const REVIEW_PRESET_LABEL: Record<ReviewExportPreset, string> = {
  this_week: '本周',
  last_week: '上周',
  this_month: '本月',
  last_month: '上月',
};
