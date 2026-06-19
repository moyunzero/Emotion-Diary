import { formatLocaleDate } from '@/shared/formatting';
import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';
import { i18n } from '@/i18n';
import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { resolveTriggerLabel } from '@/i18n/resolvePresetLabel';
import { TRIGGER_KEYS } from '../constants';
import { MoodEntry, MoodLevel } from '../types';
import { isAuthError, isNetworkError } from './errorHandler';
import type { ReviewExportClosingSummary } from './reviewExportClosingInput';

/**
 * AI服务工具类
 * 使用 Groq API 实现情绪分析、预测和文本生成功能
 * Groq 提供免费、快速、稳定的 AI 推理服务
 */

// 从环境变量读取 Groq API Key（运行时读取，便于测试和热更新）
const getGroqApiKey = (): string => process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// Groq API 配置
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// 使用 Llama 3.1 8B 模型 - 快速、免费、支持中文
const GROQ_MODEL = 'llama-3.1-8b-instant';

// 缓存机制
// 添加缓存大小限制，防止内存泄漏
const MAX_CACHE_SIZE = 50; // 最大缓存条目数

/**
 * 缓存条目接口
 */
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

type TimeSlotKey = 'morning' | 'afternoon' | 'evening';

const TRIGGER_KEY_SET = new Set<string>(TRIGGER_KEYS);

const LEGACY_TRIGGER_ZH: Record<string, (typeof TRIGGER_KEYS)[number]> = {
  工作: 'work',
  学习: 'study',
  家庭: 'family',
  朋友: 'friends',
  沟通: 'communication',
  信任: 'trust',
  隐私: 'privacy',
  其他: 'other',
};

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

function normalizeTriggerKey(raw: string): string {
  if (TRIGGER_KEY_SET.has(raw)) return raw;
  return LEGACY_TRIGGER_ZH[raw] ?? raw;
}

function weekdayLabel(locale: AppLocale, dayIndex: number): string {
  return tInsights(locale)(`utils.weekdays.${dayIndex}` as 'utils.weekdays.0');
}

function timeSlotLabel(locale: AppLocale, slot: TimeSlotKey): string {
  return tAi(locale)(`forecast.timeSlot.${slot}`);
}

export function buildAiCacheKey(
  locale: AppLocale,
  segment: string,
  ...parts: (string | number)[]
): string {
  return `loc:${locale}:${segment}:${parts.join(':')}`;
}

export function clearAiCache(): void {
  cache.clear();
}

/**
 * 清理过期缓存
 */
const cleanExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= value.ttl) {
      cache.delete(key);
    }
  }
};

/**
 * 清理最旧的缓存条目（当缓存超过最大大小时）
 */
const evictOldestCache = (): void => {
  if (cache.size <= MAX_CACHE_SIZE) return;
  
  // 按时间戳排序，删除最旧的条目
  const entries = Array.from(cache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const toDelete = entries.slice(0, cache.size - MAX_CACHE_SIZE);
  for (const [key] of toDelete) {
    cache.delete(key);
  }
};

/**
 * 从缓存获取数据
 */
const getCached = <T = unknown>(key: string): T | null => {
  // 先清理过期缓存
  cleanExpiredCache();
  
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
};

/**
 * 设置缓存
 */
const setCache = <T = unknown>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void => {
  // 清理过期缓存
  cleanExpiredCache();
  
  // 如果缓存超过最大大小，清理最旧的条目
  evictOldestCache();
  
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

/** @internal unit tests only */
export function __seedAiCacheForTest<T>(key: string, data: T): void {
  setCache(key, data, 60_000);
}

/** @internal unit tests only */
export function __peekAiCacheForTest<T>(key: string): T | null {
  return getCached<T>(key);
}

/**
 * 错误类型枚举（用于 AI 服务特定的错误分类）
 */
enum AIErrorType {
  NO_TOKEN = 'NO_TOKEN',           // 未配置 Token
  INVALID_TOKEN = 'INVALID_TOKEN', // Token 无效
  RATE_LIMIT = 'RATE_LIMIT',       // 请求频率限制
  MODEL_ERROR = 'MODEL_ERROR',     // 模型不可用
  NETWORK_ERROR = 'NETWORK_ERROR', // 网络错误
  UNKNOWN = 'UNKNOWN',             // 未知错误
}

/**
 * 分析错误类型（AI 服务专用）
 */
const classifyError = (error: Error | unknown): AIErrorType => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // 使用统一的错误判断函数
  if (isAuthError(error) || message.includes('invalid_api_key')) {
    return AIErrorType.INVALID_TOKEN;
  }
  if (message.includes('rate limit') || message.includes('429') || message.includes('too many requests')) {
    return AIErrorType.RATE_LIMIT;
  }
  if (message.includes('model') || message.includes('403') || message.includes('not found')) {
    return AIErrorType.MODEL_ERROR;
  }
  if (isNetworkError(error)) {
    return AIErrorType.NETWORK_ERROR;
  }
  return AIErrorType.UNKNOWN;
};

/**
 * 检查 Groq API Key 是否有效（基本格式检查）
 */
const isApiKeyValid = (): boolean => {
  const apiKey = getGroqApiKey();
  return apiKey.length > 0 && (apiKey.startsWith('gsk_') || apiKey.length > 20);
};

/**
 * Groq API 响应接口
 */
interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Groq API 错误响应接口
 */
interface GroqErrorResponse {
  error?: {
    message?: string;
  };
}

/**
 * 调用 Groq API 生成文本
 */
const callGroqAPI = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 300
): Promise<string> => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getGroqApiKey()}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      let errorData: GroqErrorResponse = {};
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    let data: GroqResponse;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error('API 返回了无效的响应格式');
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('API 返回了无效的内容格式');
    }

    return content;
  } catch (error) {
    throw error;
  }
};

/**
 * 重试机制包装函数
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorType = classifyError(lastError);
      
      // 对于 Token 无效或模型错误，不需要重试
      if (errorType === AIErrorType.INVALID_TOKEN || errorType === AIErrorType.MODEL_ERROR) {
        throw error;
      }
      
      // 对于频率限制，等待更长时间
      if (errorType === AIErrorType.RATE_LIMIT) {
        await new Promise(resolve => setTimeout(resolve, delay * 3 * (i + 1)));
        continue;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError || new Error('操作失败');
};

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
 * 情绪处方接口
 */
export interface EmotionPrescription {
  urgent: string;
  shortTerm: string;
  longTerm: string;
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

    data.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dayOfWeek = date.getDay();
      const timeSlot = getTimeSlotKey(date.getHours());

      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
      timeOfDayCounts[timeSlot] = (timeOfDayCounts[timeSlot] || 0) + 1;

      entry.triggers?.forEach(trigger => {
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
      .map(p => ({
        ...p,
        timeOfDay: timeSlotLabel(
          locale,
          (Object.entries(timeOfDayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
            'morning') as TimeSlotKey,
        ),
      }));

    const highRiskPeriods: EmotionCycleAnalysis['highRiskPeriods'] = patterns
      .filter(p => p.frequency >= data.length * 0.2)
      .map(p => ({
        period: `${p.dayOfWeek}${p.timeOfDay}`,
        riskLevel: (p.frequency >= data.length * 0.3 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        description: tAi(locale)('forecast.highRiskDescription', {
          dayOfWeek: p.dayOfWeek,
          timeSlot: p.timeOfDay,
        }),
      }));

    const triggerFactors = Object.entries(triggerCounts)
      .map(([trigger, data]) => ({
        trigger,
        frequency: data.count,
        avgMoodLevel: data.totalLevel / data.count,
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
    const avgMoodLevel = data.length > 0
      ? data.reduce((sum, e) => sum + e.moodLevel, 0) / data.length
      : 2.5;

    const predictions: EmotionForecast['predictions'] = [];
    const warnings: EmotionForecast['warnings'] = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const dateStr = futureDate.toISOString().split('T')[0];
      const weekdayName = weekdayLabel(locale, dayOfWeek);

      const highRiskPeriod = cycleAnalysis.highRiskPeriods.find(
        p => p.period.includes(weekdayName),
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

    const highCount = warnings.filter(w => w.severity === 'high').length;
    const summary = warnings.length > 0
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
 * 是否已配置可用的 Groq API Key（供 UI 判断是否展示「加载中」等）
 */
export function isGroqConfigured(): boolean {
  return isApiKeyValid();
}

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
 * 可选 D-11：可按 preset+周期+entries 指纹做 24h 内存缓存，与播客共用 cache Map。
 * @param summary 统计摘要
 * @param userId 用户 ID（用于缓存 key 区分）
 * @param userName 用户昵称（用于 prompt 个性化）
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

  if (!isApiKeyValid()) {
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

/**
 * 生成情绪播客文案
 * @param entries 情绪记录列表
 * @param period 周期（week/month）
 * @param userId 用户 ID（用于缓存 key 区分）
 * @param userName 用户昵称（用于 prompt 个性化）
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
    if (!isApiKeyValid()) {
      return getDefaultPodcast(entries, period, locale);
    }

    const now = Date.now();
    const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const recentEntries = data
      .filter(e => now - e.timestamp < periodMs)
      .slice(-30);

    if (recentEntries.length === 0) {
      return t('fallbacks.podcast.empty');
    }

    const totalCount = recentEntries.length;
    const resolvedCount = recentEntries.filter(e => e.status === 'resolved').length;
    const avgMoodLevel = recentEntries.reduce((sum, e) => sum + e.moodLevel, 0) / totalCount;
    const topTriggers = recentEntries
      .flatMap(e => e.triggers || [])
      .reduce((acc, triggerKey) => {
        acc[triggerKey] = (acc[triggerKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const topTriggerRaw = Object.entries(topTriggers)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || t('forecast.defaultTrigger');
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
  const recentEntries = data.filter(
    (e) => now - e.timestamp < periodMs,
  );
  const totalCount = recentEntries.length;
  const resolvedCount = recentEntries.filter(e => e.status === 'resolved').length;
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
 * 生成情绪处方
 * @param trigger 触发因素
 * @param moodLevel 情绪等级
 * @param entries 情绪记录列表
 * @param userId 用户 ID（用于缓存 key 区分）
 * @param userName 用户昵称（用于 prompt 个性化）
 * @param firstEntryDate 第一条记录的时间戳（用于计算陪伴天数）
 */
export const generateEmotionPrescription = async (
  trigger: string,
  moodLevel: MoodLevel,
  entries: MoodEntry[],
  userId: string = 'anonymous',
  userName: string = '朋友',
  firstEntryDate?: number,
  locale: AppLocale = defaultLocale(),
): Promise<EmotionPrescription> => {
  const t = tAi(locale);
  const cacheKey = buildAiCacheKey(
    locale,
    'rx',
    userId,
    trigger,
    moodLevel,
    entries.length,
  );
  const cached = getCached<EmotionPrescription>(cacheKey);
  if (cached) return cached;

  const companionDays = firstEntryDate
    ? Math.floor((Date.now() - firstEntryDate) / (1000 * 60 * 60 * 24))
    : 0;
  const recentTriggers = excludeSoftDeletedEntries(entries)
    .slice(-10)
    .flatMap(e => e.triggers || [])
    .reduce((acc, triggerKey) => {
      acc[triggerKey] = (acc[triggerKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const topRecurringTriggers = Object.entries(recentTriggers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([raw]) => resolveTriggerLabel(raw, locale));

  try {
    if (!isApiKeyValid()) {
      return getDefaultPrescription(trigger, moodLevel, locale);
    }

    const triggerLabel = resolveTriggerLabel(trigger, locale);
    const companionLine =
      companionDays > 0
        ? t('prompts.prescription.companionLine', { userName, companionDays })
        : '';
    const recurringLine =
      topRecurringTriggers.length > 0
        ? t('prompts.prescription.recurringLine', {
            triggers: topRecurringTriggers.join(locale === 'en-US' ? ', ' : '、'),
          })
        : '';

    const systemPrompt = t('prompts.prescription.system', { userName });
    const userPrompt = t('prompts.prescription.user', {
      userName,
      trigger: triggerLabel,
      moodLevel,
      companionLine,
      recurringLine,
    });

    try {
      const response = await withRetry(async () => {
        return await callGroqAPI(systemPrompt, userPrompt, 200);
      }, 2);

      const lines = response.split('\n').filter(line => line.trim());
      const urgent = lines.find(l => l.includes('1.') || l.includes('紧急'))?.replace(/^1\.\s*/, '').replace(/紧急.*[:：]\s*/, '').trim() || '';
      const shortTerm = lines.find(l => l.includes('2.') || l.includes('短期'))?.replace(/^2\.\s*/, '').replace(/短期.*[:：]\s*/, '').trim() || '';
      const longTerm = lines.find(l => l.includes('3.') || l.includes('长期'))?.replace(/^3\.\s*/, '').replace(/长期.*[:：]\s*/, '').trim() || '';

      if (urgent && shortTerm && longTerm) {
        const prescription: EmotionPrescription = { urgent, shortTerm, longTerm };
        setCache(cacheKey, prescription, 7 * 24 * 60 * 60 * 1000);
        return prescription;
      }

      return getDefaultPrescription(trigger, moodLevel, locale);
    } catch (error) {
      const errorType = classifyError(error);
      if (errorType === AIErrorType.UNKNOWN) {
        console.warn('AI生成处方失败，使用默认处方:', error);
      }
    }

    return getDefaultPrescription(trigger, moodLevel, locale);
  } catch (error) {
    console.error('生成情绪处方失败:', error);
    return getDefaultPrescription(trigger, moodLevel, locale);
  }
};

/**
 * 生成默认情绪处方（降级策略）
 */
const getDefaultPrescription = (
  trigger: string,
  moodLevel: MoodLevel,
  locale: AppLocale = defaultLocale(),
): EmotionPrescription => {
  const t = tAi(locale);
  const triggerKey = normalizeTriggerKey(trigger);
  const levelKey = String(moodLevel) as '1' | '2' | '3' | '4' | '5';
  const triggerFallbackKey = TRIGGER_KEY_SET.has(triggerKey)
    ? (triggerKey as (typeof TRIGGER_KEYS)[number])
    : null;

  const urgent =
    t(`fallbacks.prescription.urgentByLevel.${levelKey}` as 'fallbacks.prescription.urgentByLevel.1', {
      defaultValue: t('fallbacks.prescription.urgentDefault'),
    });
  const shortTerm = triggerFallbackKey
    ? t(
        `fallbacks.prescription.shortTermByTrigger.${triggerFallbackKey}` as 'fallbacks.prescription.shortTermByTrigger.work',
        { defaultValue: t('fallbacks.prescription.shortTermDefault') },
      )
    : t('fallbacks.prescription.shortTermDefault');
  const longTerm = triggerFallbackKey
    ? t(
        `fallbacks.prescription.longTermByTrigger.${triggerFallbackKey}` as 'fallbacks.prescription.longTermByTrigger.work',
        { defaultValue: t('fallbacks.prescription.longTermDefault') },
      )
    : t('fallbacks.prescription.longTermDefault');

  return { urgent, shortTerm, longTerm };
};
