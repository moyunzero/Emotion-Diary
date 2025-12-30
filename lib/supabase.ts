import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// 创建一个适配器，将SecureStore的API转换为Supabase期望的格式
// 添加错误处理，防止 SecureStore 操作失败导致应用崩溃
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore getItem failed for key ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`SecureStore setItem failed for key ${key}:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore removeItem failed for key ${key}:`, error);
    }
  },
};

// 获取环境变量，如果缺失则使用空字符串（避免应用崩溃）
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// 检查环境变量是否配置
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase 环境变量未配置！应用将以离线模式运行。\n' +
    '请确保在 .env 文件或 EAS Secrets 中配置了以下变量：\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// 创建 Supabase 客户端
// 即使环境变量为空，也创建客户端，避免应用崩溃
// 后续操作会通过错误处理来处理未配置的情况
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
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
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
};