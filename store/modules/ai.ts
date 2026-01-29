/**
 * AI 功能模块
 * 负责情绪预测和播客生成
 */

import { EmotionForecast, EmotionPodcast, MoodEntry } from '../../types';
import { generateEmotionPodcast, predictEmotionTrend } from '../../utils/aiService';
import { AIModule } from './types';

/**
 * 创建 AI 功能模块
 */
export const createAIModule = (
  set: (partial: Partial<AIModule>) => void,
  get: () => AIModule & { entries: MoodEntry[] }
): AIModule => ({
  emotionForecast: null,
  emotionPodcast: null,

  /**
   * 生成情绪预测
   */
  generateForecast: async (days: number = 7) => {
    try {
      const { entries } = get();

      if (entries.length < 3) {
        console.log('数据不足，无法生成预测');
        set({ emotionForecast: null });
        return;
      }

      const forecast = await predictEmotionTrend(entries, days);
      set({
        emotionForecast: {
          ...forecast,
          lastUpdated: Date.now(),
        },
      });
    } catch (error) {
      console.error('生成情绪预测失败:', error);
      set({ emotionForecast: null });
    }
  },

  /**
   * 生成情绪播客
   */
  generatePodcast: async (period: 'week' | 'month' = 'week') => {
    try {
      const { entries } = get();

      const content = await generateEmotionPodcast(entries, period);

      if (content) {
        set({
          emotionPodcast: {
            content,
            period,
            generatedAt: Date.now(),
          },
        });
      }
    } catch (error) {
      console.error('生成情绪播客失败:', error);
      set({ emotionPodcast: null });
    }
  },

  /**
   * 清除情绪预测
   */
  clearForecast: () => {
    set({ emotionForecast: null });
  },

  /**
   * 清除情绪播客
   */
  clearPodcast: () => {
    set({ emotionPodcast: null });
  },
});

/**
 * 检查预测是否过期
 * @param forecast 情绪预测
 * @param maxAge 最大有效期（毫秒），默认 12 小时
 */
export const isForecastExpired = (
  forecast: EmotionForecast | null,
  maxAge: number = 12 * 60 * 60 * 1000
): boolean => {
  if (!forecast || !forecast.lastUpdated) return true;
  return Date.now() - forecast.lastUpdated > maxAge;
};

/**
 * 检查播客是否过期
 * @param podcast 情绪播客
 * @param maxAge 最大有效期（毫秒），默认 24 小时
 */
export const isPodcastExpired = (
  podcast: EmotionPodcast | null,
  maxAge: number = 24 * 60 * 60 * 1000
): boolean => {
  if (!podcast) return true;
  return Date.now() - podcast.generatedAt > maxAge;
};
