import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

/** 初始尝试 + 最多 2 次重试（D-18） */
export const SECURE_STORE_SET_MAX_ATTEMPTS = 3;
/** 重试前短退避（毫秒） */
export const SECURE_STORE_SET_BACKOFF_MS = 50;

export type SecureStorePersistFailureHandler = (() => void) | null;

let onSecureStorePersistFailure: SecureStorePersistFailureHandler = null;

/**
 * 注册 SecureStore setItem 最终失败回调（由 store 初始化接线；lib 不得 import store）。
 */
export function registerSecureStorePersistFailureHandler(
  fn: SecureStorePersistFailureHandler,
): void {
  onSecureStorePersistFailure = fn;
}

export type SecureStoreSetRetryOptions = {
  maxAttempts?: number;
  backoffMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 可注入的 setItem 重试：成功返回 `ok`；全部失败后通知 handler 一次并返回 `failed`。
 */
export async function runSecureStoreSetItemWithRetry(
  write: () => Promise<void>,
  options?: SecureStoreSetRetryOptions,
): Promise<'ok' | 'failed'> {
  const maxAttempts = options?.maxAttempts ?? SECURE_STORE_SET_MAX_ATTEMPTS;
  const backoffMs = options?.backoffMs ?? SECURE_STORE_SET_BACKOFF_MS;
  const sleep = options?.sleep ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await write();
      return 'ok';
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await sleep(backoffMs);
      }
    }
  }

  try {
    onSecureStorePersistFailure?.();
  } catch (handlerError) {
    logger.warn('supabase', 'SecureStore persist failure handler threw', handlerError);
  }

  logger.warn('supabase', 'SecureStore setItem exhausted retries', lastError);
  return 'failed';
}

// 创建一个适配器，将SecureStore的API转换为Supabase期望的格式
// 添加错误处理，防止 SecureStore 操作失败导致应用崩溃
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.warn('supabase', `SecureStore getItem failed for key ${key}`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    const result = await runSecureStoreSetItemWithRetry(() =>
      SecureStore.setItemAsync(key, value),
    );
    if (result === 'failed') {
      logger.warn(
        'supabase',
        `SecureStore setItem failed for key ${key} after retries`,
      );
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.warn('supabase', `SecureStore removeItem failed for key ${key}`, error);
    }
  },
};

// 获取环境变量，如果缺失则使用空字符串（避免应用崩溃）
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// 检查环境变量是否配置
if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn(
    'supabase',
    'Supabase 环境变量未配置，应用将以离线模式运行（需 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY）',
  );
}

/** 离线占位用假 URL（非用户可见文案）；域名与对外品牌无关 */
const OFFLINE_SUPABASE_URL = "https://offline.fenyu.app";
const OFFLINE_SUPABASE_KEY = "offline-mode-disabled";

// 创建 Supabase 客户端
// 即使环境变量为空，也创建一个离线占位客户端，避免应用崩溃
// 后续操作通过 isSupabaseConfigured() 控制云端能力是否可用
export const supabase = createClient(
  supabaseUrl || OFFLINE_SUPABASE_URL,
  supabaseAnonKey || OFFLINE_SUPABASE_KEY,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// 检查 Supabase 是否已正确配置
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};
