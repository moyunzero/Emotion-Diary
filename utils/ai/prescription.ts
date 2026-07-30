import { excludeSoftDeletedEntries } from '@/shared/entries/visibility';
import { i18n } from '@/i18n';
import type { AppLocale } from '@/i18n/mapDeviceLocale';
import { resolveTriggerLabel } from '@/i18n/resolvePresetLabel';
import { TRIGGER_KEYS } from '../../constants';
import { MoodEntry, MoodLevel } from '../../types';
import { buildAiCacheKey, getCached, setCache } from './cache';
import { AIErrorType, callGroqAPI, classifyError, isGroqConfigured, withRetry } from './client';

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

function normalizeTriggerKey(raw: string): string {
  if (TRIGGER_KEY_SET.has(raw)) return raw;
  return LEGACY_TRIGGER_ZH[raw] ?? raw;
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

  const urgent = t(
    `fallbacks.prescription.urgentByLevel.${levelKey}` as 'fallbacks.prescription.urgentByLevel.1',
    {
      defaultValue: t('fallbacks.prescription.urgentDefault'),
    },
  );
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

/**
 * 生成情绪处方
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
  const cacheKey = buildAiCacheKey(locale, 'rx', userId, trigger, moodLevel, entries.length);
  const cached = getCached<EmotionPrescription>(cacheKey);
  if (cached) return cached;

  const companionDays = firstEntryDate
    ? Math.floor((Date.now() - firstEntryDate) / (1000 * 60 * 60 * 24))
    : 0;
  const recentTriggers = excludeSoftDeletedEntries(entries)
    .slice(-10)
    .flatMap((e) => e.triggers || [])
    .reduce(
      (acc, triggerKey) => {
        acc[triggerKey] = (acc[triggerKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  const topRecurringTriggers = Object.entries(recentTriggers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([raw]) => resolveTriggerLabel(raw, locale));

  try {
    if (!isGroqConfigured()) {
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

      const lines = response.split('\n').filter((line) => line.trim());
      const urgent =
        lines
          .find((l) => l.includes('1.') || l.includes('紧急'))
          ?.replace(/^1\.\s*/, '')
          .replace(/紧急.*[:：]\s*/, '')
          .trim() || '';
      const shortTerm =
        lines
          .find((l) => l.includes('2.') || l.includes('短期'))
          ?.replace(/^2\.\s*/, '')
          .replace(/短期.*[:：]\s*/, '')
          .trim() || '';
      const longTerm =
        lines
          .find((l) => l.includes('3.') || l.includes('长期'))
          ?.replace(/^3\.\s*/, '')
          .replace(/长期.*[:：]\s*/, '')
          .trim() || '';

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
