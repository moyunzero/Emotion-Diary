import { MoodEntry, MoodLevel } from '../types';

/**
 * AI服务工具类
 * 使用 Groq API 实现情绪分析、预测和文本生成功能
 * Groq 提供免费、快速、稳定的 AI 推理服务
 */

// 从环境变量获取 Groq API Key
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// Groq API 配置
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// 使用 Llama 3.1 8B 模型 - 快速、免费、支持中文
const GROQ_MODEL = 'llama-3.1-8b-instant';

// 缓存机制
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * 从缓存获取数据
 */
const getCached = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

/**
 * 设置缓存
 */
const setCache = (key: string, data: any, ttl: number = 24 * 60 * 60 * 1000) => {
  cache.set(key, { data, timestamp: Date.now(), ttl });
};

/**
 * 错误类型枚举
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
 * 分析错误类型
 */
const classifyError = (error: any): AIErrorType => {
  const message = error?.message || String(error);
  
  if (message.includes('401') || message.includes('Invalid') || message.includes('Unauthorized') || message.includes('invalid_api_key')) {
    return AIErrorType.INVALID_TOKEN;
  }
  if (message.includes('rate limit') || message.includes('429') || message.includes('Too Many Requests')) {
    return AIErrorType.RATE_LIMIT;
  }
  if (message.includes('model') || message.includes('403') || message.includes('not found')) {
    return AIErrorType.MODEL_ERROR;
  }
  if (message.includes('network') || message.includes('ENOTFOUND') || message.includes('fetch') || message.includes('Failed to fetch')) {
    return AIErrorType.NETWORK_ERROR;
  }
  return AIErrorType.UNKNOWN;
};

/**
 * 检查 Groq API Key 是否有效（基本格式检查）
 */
const isApiKeyValid = (): boolean => {
  // Groq API Key 通常以 'gsk_' 开头
  return GROQ_API_KEY.length > 0 && (GROQ_API_KEY.startsWith('gsk_') || GROQ_API_KEY.length > 20);
};

/**
 * 调用 Groq API 生成文本
 */
const callGroqAPI = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 300
): Promise<string> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
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
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
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
    } catch (error: any) {
      lastError = error as Error;
      const errorType = classifyError(error);
      
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
  entries: MoodEntry[]
): Promise<EmotionCycleAnalysis> => {
  const cacheKey = `cycle_${entries.length}_${entries[0]?.timestamp || 0}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (entries.length < 5) {
      const defaultAnalysis: EmotionCycleAnalysis = {
        patterns: [],
        highRiskPeriods: [],
        triggerFactors: [],
      };
      setCache(cacheKey, defaultAnalysis, 60 * 60 * 1000);
      return defaultAnalysis;
    }

    const dayOfWeekCounts: Record<number, number> = {};
    const timeOfDayCounts: Record<string, number> = {};
    const triggerCounts: Record<string, { count: number; totalLevel: number }> = {};

    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const timeSlot = hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';

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

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const patterns = Object.entries(dayOfWeekCounts)
      .map(([day, freq]) => ({
        dayOfWeek: weekdays[parseInt(day)],
        frequency: freq,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2)
      .map(p => ({
        ...p,
        timeOfDay: Object.entries(timeOfDayCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0],
      }));

    const highRiskPeriods: EmotionCycleAnalysis['highRiskPeriods'] = patterns
      .filter(p => p.frequency >= entries.length * 0.2)
      .map(p => ({
        period: `${p.dayOfWeek}${p.timeOfDay}`,
        riskLevel: (p.frequency >= entries.length * 0.3 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        description: `你在${p.dayOfWeek}${p.timeOfDay}情绪波动较大`,
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
    return {
      patterns: [],
      highRiskPeriods: [],
      triggerFactors: [],
    };
  }
};

/**
 * 预测情绪趋势
 */
export const predictEmotionTrend = async (
  entries: MoodEntry[],
  days: number = 7
): Promise<EmotionForecast> => {
  const cacheKey = `forecast_${entries.length}_${days}_${Date.now()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const cycleAnalysis = await analyzeEmotionCycle(entries);
    const avgMoodLevel = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.moodLevel, 0) / entries.length
      : 2.5;

    const predictions: EmotionForecast['predictions'] = [];
    const warnings: EmotionForecast['warnings'] = [];

    for (let i = 1; i <= days; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      const dateStr = futureDate.toISOString().split('T')[0];

      const highRiskPeriod = cycleAnalysis.highRiskPeriods.find(
        p => p.period.includes(['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayOfWeek])
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
          message: `⚠️ ${dateStr}是高风险日，记得多点耐心`,
          severity: 'high',
        });
      } else if (riskLevel === 'medium') {
        warnings.push({
          date: dateStr,
          message: `🌤️ ${dateStr}情绪可能波动，注意调节`,
          severity: 'medium',
        });
      }
    }

    const summary = warnings.length > 0
      ? `未来${days}天内有${warnings.filter(w => w.severity === 'high').length}个高风险日，建议提前做好准备。`
      : `未来${days}天情绪趋势平稳，继续保持良好的情绪管理习惯。`;

    const forecast: EmotionForecast = {
      predictions,
      warnings,
      summary,
    };

    setCache(cacheKey, forecast, 12 * 60 * 60 * 1000);
    return forecast;
  } catch (error) {
    console.error('情绪预测失败:', error);
    return {
      predictions: [],
      warnings: [],
      summary: '预测功能暂时不可用',
    };
  }
};

/**
 * 生成情绪播客文案
 */
export const generateEmotionPodcast = async (
  entries: MoodEntry[],
  period: 'week' | 'month' = 'week'
): Promise<string | null> => {
  const cacheKey = `podcast_${period}_${entries.length}_${entries[0]?.timestamp || 0}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (!isApiKeyValid()) {
      return getDefaultPodcast(entries, period);
    }

    const now = Date.now();
    const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const recentEntries = entries
      .filter(e => now - e.timestamp < periodMs)
      .slice(-30);

    if (recentEntries.length === 0) {
      return '最近还没有情绪记录，开始记录你的情绪吧~';
    }

    const totalCount = recentEntries.length;
    const resolvedCount = recentEntries.filter(e => e.status === 'resolved').length;
    const avgMoodLevel = recentEntries.reduce((sum, e) => sum + e.moodLevel, 0) / totalCount;
    const topTriggers = recentEntries
      .flatMap(e => e.triggers || [])
      .reduce((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const topTrigger = Object.entries(topTriggers)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '生活';

    const systemPrompt = '你是一个温暖的情绪陪伴助手，擅长用天气和花园的比喻来描述情绪。请用温柔、治愈的语气回复，像朋友一样亲切。用中文回复。';
    
    const userPrompt = `根据以下用户最近${period === 'week' ? '一周' : '一个月'}的情绪记录，生成一段200字左右的温柔回顾：

统计信息：
- 共记录${totalCount}次情绪
- 已解决${resolvedCount}次，解决率${Math.round((resolvedCount / totalCount) * 100)}%
- 平均情绪强度：${avgMoodLevel.toFixed(1)}级
- 主要触发因素：${topTrigger}

要求：
1. 用"你"称呼用户
2. 使用天气和花园的比喻
3. 肯定用户的成长和努力
4. 像朋友一样亲切
5. 200字左右`;

    try {
      const result = await withRetry(async () => {
        const generated = await callGroqAPI(systemPrompt, userPrompt, 400);
        const cleaned = generated.trim().substring(0, 500);
        
        if (cleaned.length < 50) {
          return getDefaultPodcast(entries, period);
        }
        return cleaned;
      });

      setCache(cacheKey, result, 24 * 60 * 60 * 1000);
      return result;
    } catch (error: any) {
      const errorType = classifyError(error);
      if (errorType === AIErrorType.UNKNOWN) {
        console.warn('文本生成失败，使用默认文案:', error);
      }
      return getDefaultPodcast(entries, period);
    }
  } catch (error) {
    console.error('生成情绪播客失败:', error);
    return getDefaultPodcast(entries, period);
  }
};

/**
 * 生成默认播客文案（降级策略）
 */
const getDefaultPodcast = (entries: MoodEntry[], period: 'week' | 'month'): string => {
  const now = Date.now();
  const periodMs = period === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const recentEntries = entries.filter(e => now - e.timestamp < periodMs);
  const totalCount = recentEntries.length;
  const resolvedCount = recentEntries.filter(e => e.status === 'resolved').length;
  const resolveRate = totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0;

  if (totalCount === 0) {
    return '最近还没有情绪记录，开始记录你的情绪吧~';
  }

  const periodText = period === 'week' ? '这一周' : '这一个月';
  const rateText = resolveRate >= 70
    ? '你的情绪解决率很高，花园正在茁壮成长'
    : resolveRate >= 40
    ? '你的情绪管理在进步，继续加油'
    : '记得及时处理情绪，给花园浇浇水';

  return `${periodText}，你记录了${totalCount}次情绪，其中${resolvedCount}次已经解决。${rateText}。每一次记录都是了解自己的机会，每一次解决都是成长的见证。继续保持，你的心灵花园会越来越美丽~`;
};

/**
 * 生成情绪处方
 */
export const generateEmotionPrescription = async (
  trigger: string,
  moodLevel: MoodLevel,
  entries: MoodEntry[]
): Promise<EmotionPrescription> => {
  const cacheKey = `prescription_${trigger}_${moodLevel}_${entries.length}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    if (!isApiKeyValid()) {
      return getDefaultPrescription(trigger, moodLevel);
    }

    const systemPrompt = '你是一个专业的情绪管理顾问，擅长给出具体、实用、温暖的建议。请严格按照要求的格式用中文回复。';
    
    const userPrompt = `用户因为"${trigger}"触发了${moodLevel}级情绪（1-5级，5级最强）。请给出3条具体可执行的建议：

1. 紧急建议（立即执行，不超过30字）
2. 短期建议（今天内执行，不超过30字）
3. 长期建议（持续改善，不超过30字）

格式要求：
- 每条建议独立一行
- 格式：1. [建议内容]
- 语气温暖实用`;

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
    } catch (error: any) {
      const errorType = classifyError(error);
      if (errorType === AIErrorType.UNKNOWN) {
        console.warn('AI生成处方失败，使用默认处方:', error);
      }
    }

    return getDefaultPrescription(trigger, moodLevel);
  } catch (error) {
    console.error('生成情绪处方失败:', error);
    return getDefaultPrescription(trigger, moodLevel);
  }
};

/**
 * 生成默认情绪处方（降级策略）
 */
const getDefaultPrescription = (trigger: string, moodLevel: MoodLevel): EmotionPrescription => {
  const urgentActions: Record<number, string> = {
    1: '深呼吸10次，让自己冷静下来',
    2: '离开现场，找个安静的地方待5分钟',
    3: '深呼吸20次，或者去散步10分钟',
    4: '立即离开现场，深呼吸30次，或者听一首舒缓的音乐',
    5: '立即离开现场，深呼吸50次，或者给信任的朋友打电话',
  };

  const shortTermActions: Record<string, string> = {
    工作: '今晚找个安静的时间，写下你的感受，明天再处理',
    学习: '先休息一下，做点放松的事情，晚点再继续',
    家庭: '今晚找个合适的时间，用"我感到..."的方式表达感受',
    朋友: '今天先冷静，明天找个时间好好沟通',
    沟通: '今晚准备一下想说的话，明天找个安静的时间聊聊',
    信任: '给彼此一些空间，等情绪平复后再沟通',
    隐私: '尊重彼此的边界，先冷静下来再讨论',
  };

  const longTermActions: Record<string, string> = {
    工作: '学习压力管理技巧，建立工作与生活的平衡',
    学习: '制定合理的学习计划，避免过度压力',
    家庭: '学习非暴力沟通技巧，改善家庭关系',
    朋友: '定期与朋友沟通，建立更深的信任',
    沟通: '学习表达技巧，用"我"语句代替指责',
    信任: '通过小事情逐步建立信任，给彼此时间',
    隐私: '与对方讨论边界问题，找到双方都舒适的平衡点',
  };

  return {
    urgent: urgentActions[moodLevel] || '深呼吸，让自己冷静下来',
    shortTerm: shortTermActions[trigger] || '今晚找个安静的时间，写下你的感受',
    longTerm: longTermActions[trigger] || '持续关注情绪管理，学习相关技巧',
  };
};
