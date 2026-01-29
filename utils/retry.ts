/**
 * 重试机制工具
 * 提供指数退避重试策略
 */

import { isNetworkError, isTemporaryError } from './errorHandler';

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始延迟时间（毫秒） */
  initialDelay: number;
  /** 最大延迟时间（毫秒） */
  maxDelay: number;
  /** 退避因子 */
  backoffFactor: number;
  /** 是否应该重试的判断函数 */
  shouldRetry?: (error: Error) => boolean;
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 计算下一次重试的延迟时间（指数退避）
 */
const calculateDelay = (
  attempt: number,
  config: RetryConfig
): number => {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
  return Math.min(exponentialDelay, config.maxDelay);
};

/**
 * 使用指数退避策略重试异步函数
 * 
 * @param fn 要重试的异步函数
 * @param config 重试配置
 * @returns 函数执行结果
 * 
 * @example
 * ```typescript
 * const result = await withExponentialBackoff(
 *   async () => await fetchData(),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export const withExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 检查是否应该重试
      if (finalConfig.shouldRetry && !finalConfig.shouldRetry(lastError)) {
        throw lastError;
      }

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === finalConfig.maxRetries - 1) {
        throw lastError;
      }

      // 计算延迟时间并等待
      const delayTime = calculateDelay(attempt, finalConfig);
      console.log(
        `重试 ${attempt + 1}/${finalConfig.maxRetries}，等待 ${delayTime}ms...`
      );
      await delay(delayTime);
    }
  }

  // 理论上不会到达这里，但为了类型安全
  throw lastError || new Error('重试失败');
};

// 导出统一的错误判断函数（从 errorHandler 导入）
export { isNetworkError, isTemporaryError };

/**
 * 网络请求重试配置
 */
export const NETWORK_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
  shouldRetry: isTemporaryError,
};

/**
 * AI 服务重试配置
 */
export const AI_RETRY_CONFIG: Partial<RetryConfig> = {
  maxRetries: 2,
  initialDelay: 1000,
  maxDelay: 3000,
  backoffFactor: 2,
  shouldRetry: (error: Error) => {
    const message = error.message.toLowerCase();
    // 不重试认证错误和模型错误
    if (message.includes('401') || message.includes('invalid') || message.includes('model')) {
      return false;
    }
    return isTemporaryError(error);
  },
};
