import { isAuthError, isNetworkError } from '../errorHandler';

const getGroqApiKey = (): string => process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODEL = 'llama-3.1-8b-instant';

/**
 * 错误类型枚举（用于 AI 服务特定的错误分类）
 */
export enum AIErrorType {
  INVALID_TOKEN = 'INVALID_TOKEN',
  RATE_LIMIT = 'RATE_LIMIT',
  MODEL_ERROR = 'MODEL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 分析错误类型（AI 服务专用）
 */
export const classifyError = (error: Error | unknown): AIErrorType => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

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

const isApiKeyValid = (): boolean => {
  const apiKey = getGroqApiKey();
  return apiKey.length > 0 && (apiKey.startsWith('gsk_') || apiKey.length > 20);
};

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface GroqErrorResponse {
  error?: {
    message?: string;
  };
}

export const callGroqAPI = async (
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 300,
): Promise<string> => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getGroqApiKey()}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
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

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000,
): Promise<T> => {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorType = classifyError(lastError);

      if (errorType === AIErrorType.INVALID_TOKEN || errorType === AIErrorType.MODEL_ERROR) {
        throw error;
      }

      if (errorType === AIErrorType.RATE_LIMIT) {
        await new Promise((resolve) => setTimeout(resolve, delay * 3 * (i + 1)));
        continue;
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError || new Error('操作失败');
};

/**
 * 是否已配置可用的 Groq API Key（供 UI 判断是否展示「加载中」等）
 */
export function isGroqConfigured(): boolean {
  return isApiKeyValid();
}
