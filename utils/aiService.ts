/**
 * AI 服务 barrel — 保持 @/utils/aiService 导入稳定 (D-09)
 */

export {
  buildAiCacheKey,
  clearAiCache,
  __seedAiCacheForTest,
  __peekAiCacheForTest,
} from './ai/cache';
export { isGroqConfigured } from './ai/client';
export {
  analyzeEmotionCycle,
  predictEmotionTrend,
  getDefaultReviewExportClosingLine,
  generateReviewExportClosingLine,
  type EmotionCycleAnalysis,
  type EmotionForecast,
} from './ai/forecast';
export { generateEmotionPodcast } from './ai/podcast';
export {
  generateEmotionPrescription,
  type EmotionPrescription,
} from './ai/prescription';
