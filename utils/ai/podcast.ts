import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';
import { i18n } from '@/i18n';
import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { resolveTriggerLabel } from '@/i18n/resolvePresetLabel';
import { MoodEntry } from '@/types';
import { buildAiCacheKey, getCached, setCache } from './cache';
import { AIErrorType, callGroqAPI, classifyError, isGroqConfigured, withRetry } from './client';

function defaultLocale(): AppLocale {
  return i18n.language === 'en-US' ? 'en-US' : 'zh-Hans';
}

function tAi(locale: AppLocale) {
  return i18n.getFixedT(locale, 'ai');
}

/**
 * 生成默认播客文案（降级策略）
 */
const getDefaultPodcast = (
  entries: MoodEntry[],
  period: 'week' | 'month',
  locale: AppLocale = defaultLocale(),
): string => {
  const t = tAi(locale);
  const data = excludeSoftDeletedEntries(entries);
  const now = Date.now();
  const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const recentEntries = data.filter((e) => now - e.timestamp < periodMs);
  const totalCount = recentEntries.length;
  const resolvedCount = recentEntries.filter((e) => e.status === 'resolved').length;
  const resolveRate = totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0;

  if (totalCount === 0) {
    return t('fallbacks.podcast.empty');
  }

  const periodText =
    period === 'week' ? t('fallbacks.podcast.periodWeek') : t('fallbacks.podcast.periodMonth');
  const rateText =
    resolveRate >= 70
      ? t('fallbacks.podcast.rateHigh')
      : resolveRate >= 40
        ? t('fallbacks.podcast.rateMedium')
        : t('fallbacks.podcast.rateLow');

  return t('fallbacks.podcast.default', {
    periodText,
    totalCount,
    resolvedCount,
    rateText,
  });
};

/**
 * 生成情绪播客文案
 */
export const generateEmotionPodcast = async (
  entries: MoodEntry[],
  period: 'week' | 'month' = 'week',
  userId: string = 'anonymous',
  userName: string = '朋友',
  locale: AppLocale = defaultLocale(),
): Promise<string | null> => {
  const data = excludeSoftDeletedEntries(entries);
  const t = tAi(locale);
  const cacheKey = buildAiCacheKey(
    locale,
    'rx_podcast',
    userId,
    period,
    data.length,
    data[0]?.timestamp || 0,
  );
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    if (!isGroqConfigured()) {
      return getDefaultPodcast(entries, period, locale);
    }

    const now = Date.now();
    const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const recentEntries = data.filter((e) => now - e.timestamp < periodMs).slice(-30);

    if (recentEntries.length === 0) {
      return t('fallbacks.podcast.empty');
    }

    const totalCount = recentEntries.length;
    const resolvedCount = recentEntries.filter((e) => e.status === 'resolved').length;
    const avgMoodLevel = recentEntries.reduce((sum, e) => sum + e.moodLevel, 0) / totalCount;
    const topTriggers = recentEntries
      .flatMap((e) => e.triggers || [])
      .reduce(
        (acc, triggerKey) => {
          acc[triggerKey] = (acc[triggerKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );
    const topTriggerRaw =
      Object.entries(topTriggers).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      t('forecast.defaultTrigger');
    const topTrigger = resolveTriggerLabel(topTriggerRaw, locale);

    const periodLabel =
      period === 'week' ? t('prompts.podcast.periodWeek') : t('prompts.podcast.periodMonth');

    const systemPrompt = t('prompts.podcast.system', { userName });
    const userPrompt = t('prompts.podcast.user', {
      userName,
      periodLabel,
      totalCount,
      resolvedCount,
      resolveRatePct: Math.round((resolvedCount / totalCount) * 100),
      avgMoodLevel: avgMoodLevel.toFixed(1),
      topTrigger,
    });

    try {
      const result = await withRetry(async () => {
        const generated = await callGroqAPI(systemPrompt, userPrompt, 400);
        const cleaned = generated.trim().substring(0, 500);

        if (cleaned.length < 50) {
          return getDefaultPodcast(entries, period, locale);
        }
        return cleaned;
      });

      setCache(cacheKey, result, 24 * 60 * 60 * 1000);
      return result;
    } catch (error) {
      const errorType = classifyError(error);
      if (errorType === AIErrorType.UNKNOWN) {
        console.warn('文本生成失败，使用默认文案:', error);
      }
      return getDefaultPodcast(entries, period, locale);
    }
  } catch (error) {
    console.error('生成情绪播客失败:', error);
    return getDefaultPodcast(entries, period, locale);
  }
};
