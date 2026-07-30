import { formatLocaleDate } from '@/shared/formatting';
import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';
import { i18n } from '@/i18n';
import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { MoodEntry } from '@/types';
import type { ReviewExportClosingSummary } from '../reviewExportClosingInput';
import { buildAiCacheKey, getCached, setCache } from './cache';
import { callGroqAPI, isGroqConfigured, withRetry } from './client';

type TimeSlotKey = 'morning' | 'afternoon' | 'evening';

function defaultLocale(): AppLocale {
  return i18n.language === 'en-US' ? 'en-US' : 'zh-Hans';
}

function tAi(locale: AppLocale) {
  return i18n.getFixedT(locale, 'ai');
}

function tInsights(locale: AppLocale) {
  return i18n.getFixedT(locale, 'insights');
}

function getTimeSlotKey(hour: number): TimeSlotKey {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function weekdayLabel(locale: AppLocale, dayIndex: number): string {
  return tInsights(locale)(`utils.weekdays.${dayIndex}` as 'utils.weekdays.0');
}

function timeSlotLabel(locale: AppLocale, slot: TimeSlotKey): string {
  return tAi(locale)(`forecast.timeSlot.${slot}`);
}

/**
 * 情绪周期分析接口
 */
export interface EmotionCycleAnalysis {
  patterns: {
    dayOfWeek?: string;
    timeOfDay?: string;
    frequency: number;
  }[];
  highRiskPeriods: {
    period: string;
    riskLevel: 'high' | 'medium' | 'low';
    description: string;
  }[];
  triggerFactors: {
    trigger: string;
    frequency: number;
    avgMoodLevel: number;
  }[];
}

/**
 * 情绪预测接口
 */
export interface EmotionForecast {
  predictions: {
    date: string;
    predictedMoodLevel: number;
    confidence: number;
    riskLevel: 'high' | 'medium' | 'low';
  }[];
  warnings: {
    date: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  summary: string;
}

/**
 * 分析情绪周期
 * 基于历史数据识别周期性模式和触发因素
 */
export const analyzeEmotionCycle = async (
  entries: MoodEntry[],
  locale: AppLocale = defaultLocale(),
): Promise<EmotionCycleAnalysis> => {
  const data = excludeSoftDeletedEntries(entries);
  const cacheKey = buildAiCacheKey(
    locale,
    'cycle',
    data.length,
    data[0]?.timestamp || 0,
  );
  const cached = getCached<EmotionCycleAnalysis>(cacheKey);
  if (cached) return cached;

  try {
    if (data.length < 5) {
      const defaultAnalysis: EmotionCycleAnalysis = {
        patterns: [],
        highRiskPeriods: [],
        triggerFactors: [],
      };
      setCache(cacheKey, defaultAnalysis, 60 * 60 * 1000);
      return defaultAnalysis;
    }

    const dayOfWeekCounts: Record<number, number> = {};
    const timeOfDayCounts: Record<TimeSlotKey, number> = {
      morning: 0,
      afternoon: 0,
      evening: 0,
    };
    const triggerCounts: Record<string, { count: number; totalLevel: number }> = {};

    data.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const dayOfWeek = date.getDay();
      const timeSlot = getTimeSlotKey(date.getHours());

      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      timeOfDayCounts[timeSlot] = (timeOfDayCounts[timeSlot] || 0) + 1;

      entry.triggers?.forEach((trigger) => {
        if (!triggerCounts[trigger]) {
          triggerCounts[trigger] = { count: 0, totalLevel: 0 };
        }
        triggerCounts[trigger].count++;
        triggerCounts[trigger].totalLevel += entry.moodLevel;
      });
    });

    const patterns = Object.entries(dayOfWeekCounts)
      .map(([day, freq]) => ({
        dayOfWeek: weekdayLabel(locale, Number.parseInt(day, 10)),
        frequency: freq,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2)
      .map((p) => ({
        ...p,
        timeOfDay: timeSlotLabel(
          locale,
          (Object.entries(timeOfDayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
            'morning') as TimeSlotKey,
        ),
      }));

    const highRiskPeriods: EmotionCycleAnalysis['highRiskPeriods'] = patterns
      .filter((p) => p.frequency >= data.length * 0.2)
      .map((p) => ({
        period: `${p.dayOfWeek}${p.timeOfDay}`,
        riskLevel: (p.frequency >= data.length * 0.3 ? 'high' : 'medium') as
          | 'high'
          | 'medium'
          | 'low',
        description: tAi(locale)('forecast.highRiskDescription', {
          dayOfWeek: p.dayOfWeek,
          timeSlot: p.timeOfDay,
        }),
      }));

    const triggerFactors = Object.entries(triggerCounts)
      .map(([trigger, triggerData]) => ({
        trigger,
        frequency: triggerData.count,
        avgMoodLevel: triggerData.totalLevel / triggerData.count,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const analysis: EmotionCycleAnalysis = {
      patterns,
      highRiskPeriods,
      triggerFactors,
    };

    setCache(cacheKey, analysis, 24 * 60 * 60 * 1000);
    return analysis;
  } catch (error) {
    console.error('情绪周期分析失败:', error);
    const defaultAnalysis: EmotionCycleAnalysis = {
      patterns: [],
      highRiskPeriods: [],
      triggerFactors: [],
    };
    return defaultAnalysis;
  }
};

/**
 * 预测情绪趋势
 */
export const predictEmotionTrend = async (
  entries: MoodEntry[],
  days: number = 7,
  locale: AppLocale = defaultLocale(),
): Promise<EmotionForecast> => {
  const data = excludeSoftDeletedEntries(entries);
  const t = tAi(locale);
  const latestTimestamp = data.length > 0 ? data[0].timestamp : 0;
  const cacheKey = buildAiCacheKey(
    locale,
    'forecast',
    data.length,
    days,
    Math.floor(latestTimestamp / (60 * 60 * 1000)),
  );
  const cached = getCached<EmotionForecast>(cacheKey);
  if (cached) return cached;

  try {
    const cycleAnalysis = await analyzeEmotionCycle(data, locale);
    const avgMoodLevel =
      data.length > 0 ? data.reduce((sum, e) => sum + e.moodLevel, 0) / data.length : 2.5;

    const predictions: EmotionForecast['predictions'] = [];
    const warnings: EmotionForecast['warnings'] = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const dateStr = futureDate.toISOString().split('T')[0];
      const weekdayName = weekdayLabel(locale, dayOfWeek);

      const highRiskPeriod = cycleAnalysis.highRiskPeriods.find((p) =>
        p.period.includes(weekdayName),
      );

      let predictedMoodLevel = avgMoodLevel;
      let riskLevel: 'high' | 'medium' | 'low' = 'low';

      if (highRiskPeriod) {
        predictedMoodLevel = Math.min(5, avgMoodLevel + 1);
        riskLevel = highRiskPeriod.riskLevel;
      }

      predictions.push({
        date: dateStr,
        predictedMoodLevel: Math.round(predictedMoodLevel * 10) / 10,
        confidence: 0.7,
        riskLevel,
      });

      if (riskLevel === 'high') {
        warnings.push({
          date: dateStr,
          message: t('forecast.warningHigh', { date: dateStr }),
          severity: 'high',
        });
      } else if (riskLevel === 'medium') {
        warnings.push({
          date: dateStr,
          message: t('forecast.warningMedium', { date: dateStr }),
          severity: 'medium',
        });
      }
    }

    const highCount = warnings.filter((w) => w.severity === 'high').length;
    const summary =
      warnings.length > 0
        ? t('forecast.summaryRisky', { days, highCount })
        : t('forecast.summaryStable', { days });

    const forecast: EmotionForecast = {
      predictions,
      warnings,
      summary,
    };

    setCache(cacheKey, forecast, 12 * 60 * 60 * 1000);
    return forecast;
  } catch (error) {
    console.error('情绪预测失败:', error);
    const defaultForecast: EmotionForecast = {
      predictions: [],
      warnings: [],
      summary: t('forecast.unavailable'),
    };
    return defaultForecast;
  }
};

/**
 * 回顾导出图底部一句：无网络时的固定兜底（与 Phase 2 语气接近）
 */
export function getDefaultReviewExportClosingLine(
  summary: ReviewExportClosingSummary,
  locale: AppLocale = defaultLocale(),
): string {
  const t = tAi(locale);
  if (summary.totalEntries === 0) {
    return t('fallbacks.closing.empty');
  }
  const rateText =
    summary.resolutionRatePct === null
      ? t('fallbacks.closing.rateNoData')
      : t('fallbacks.closing.rateWithValue', { pct: summary.resolutionRatePct });
  return t('fallbacks.closing.default', {
    presetLabel: summary.presetLabel,
    totalEntries: summary.totalEntries,
    resolvedEntries: summary.resolvedEntries,
    rateText,
  });
}

/**
 * 回顾导出图底部一句：Groq 生成，失败或无 Key 时返回兜底，不抛错。
 */
export async function generateReviewExportClosingLine(
  summary: ReviewExportClosingSummary,
  userId: string = 'anonymous',
  userName: string = '朋友',
  locale: AppLocale = defaultLocale(),
): Promise<string> {
  const t = tAi(locale);
  const cacheKey = buildAiCacheKey(
    locale,
    'rx_closing',
    userId,
    JSON.stringify({
      preset: summary.presetLabel,
      start: summary.periodStartMs,
      end: summary.periodEndMs,
      days: summary.companionDays,
      rate: summary.resolutionRatePct,
      delta: summary.deltaPct,
      total: summary.totalEntries,
      resolved: summary.resolvedEntries,
      weather: summary.topWeatherLines,
      triggers: summary.topTriggerLines,
    }),
  );
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  if (!isGroqConfigured()) {
    const fallback = getDefaultReviewExportClosingLine(summary, locale);
    setCache(cacheKey, fallback, 24 * 60 * 60 * 1000);
    return fallback;
  }

  const rateLine =
    summary.resolutionRatePct === null
      ? t('prompts.closing.rateNoData')
      : t('prompts.closing.rateWithValue', { pct: summary.resolutionRatePct });
  const deltaLine =
    summary.deltaPct === null
      ? t('prompts.closing.deltaNoData')
      : t('prompts.closing.deltaWithValue', {
          arrow: summary.deltaPct >= 0 ? '↑' : '↓',
          pct: Math.abs(summary.deltaPct),
        });

  const systemPrompt = t('prompts.closing.system', { userName });
  const userPrompt = t('prompts.closing.user', {
    presetLabel: summary.presetLabel,
    periodStart: formatLocaleDate(summary.periodStartMs, locale),
    periodEnd: formatLocaleDate(summary.periodEndMs, locale),
    companionDays: summary.companionDays,
    rateLine,
    deltaLine,
    totalEntries: summary.totalEntries,
    resolvedEntries: summary.resolvedEntries,
    topWeather: summary.topWeatherLines.length
      ? summary.topWeatherLines.join('；')
      : t('prompts.closing.none'),
    topTriggers: summary.topTriggerLines.length
      ? summary.topTriggerLines.join('；')
      : t('prompts.closing.none'),
  });

  try {
    const result = await withRetry(async () => {
      const raw = await callGroqAPI(systemPrompt, userPrompt, 220);
      return raw.trim().substring(0, 200);
    });
    if (result.length < 15) {
      const fallback = getDefaultReviewExportClosingLine(summary, locale);
      setCache(cacheKey, fallback, 24 * 60 * 60 * 1000);
      return fallback;
    }
    setCache(cacheKey, result, 24 * 60 * 60 * 1000);
    return result;
  } catch (error) {
    console.warn('生成回顾一句失败，使用默认文案:', error);
    const fallback = getDefaultReviewExportClosingLine(summary, locale);
    setCache(cacheKey, fallback, 24 * 60 * 60 * 1000);
    return fallback;
  }
}
