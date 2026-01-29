/**
 * 存储管理模块
 * 统一管理 AsyncStorage 操作和数据迁移逻辑
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoodEntry } from '../../types';

// 存储键常量
const LEGACY_STORAGE_KEY = 'mood_entries';
const GUEST_STORAGE_KEY = 'mood_entries_guest';

/**
 * 根据用户ID生成存储键
 */
export const getStorageKey = (userId: string | null): string => {
  return userId ? `mood_entries_${userId}` : GUEST_STORAGE_KEY;
};

/**
 * 数据迁移结果接口
 */
export interface MigrationResult {
  success: boolean;
  data: MoodEntry[] | null;
  message: string;
}

/**
 * 合并两个条目数组，使用 ID 去重
 * @param entries1 第一个条目数组
 * @param entries2 第二个条目数组
 * @param strategy 冲突解决策略：'keep-first' | 'keep-second' | 'keep-latest'
 */
export const mergeEntries = (
  entries1: MoodEntry[],
  entries2: MoodEntry[],
  strategy: 'keep-first' | 'keep-second' | 'keep-latest' = 'keep-latest'
): MoodEntry[] => {
  const mergedMap = new Map<string, MoodEntry>();

  // 添加第一个数组的条目
  entries1.forEach((entry) => mergedMap.set(entry.id, entry));

  // 添加第二个数组的条目，根据策略处理冲突
  entries2.forEach((entry) => {
    const existing = mergedMap.get(entry.id);
    
    if (!existing) {
      mergedMap.set(entry.id, entry);
    } else {
      switch (strategy) {
        case 'keep-first':
          // 保留第一个数组的条目
          break;
        case 'keep-second':
          // 使用第二个数组的条目
          mergedMap.set(entry.id, entry);
          break;
        case 'keep-latest':
          // 使用时间戳更新的条目
          if (entry.timestamp > existing.timestamp) {
            mergedMap.set(entry.id, entry);
          }
          break;
      }
    }
  });

  // 转换为数组并按时间戳排序
  const merged = Array.from(mergedMap.values());
  merged.sort((a, b) => b.timestamp - a.timestamp);
  return merged;
};

/**
 * 从存储中读取数据
 */
export const loadFromStorage = async (key: string): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`读取存储失败 (${key}):`, error);
    return [];
  }
};

/**
 * 保存数据到存储
 */
export const saveToStorage = async (
  key: string,
  entries: MoodEntry[]
): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error(`保存存储失败 (${key}):`, error);
    return false;
  }
};

/**
 * 删除存储中的数据
 */
export const removeFromStorage = async (key: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`删除存储失败 (${key}):`, error);
    return false;
  }
};

/**
 * 检查并迁移旧版本数据
 */
export const migrateFromLegacyStorage = async (
  userId: string | null
): Promise<MigrationResult> => {
  try {
    const legacyData = await loadFromStorage(LEGACY_STORAGE_KEY);
    
    if (legacyData.length === 0) {
      return {
        success: true,
        data: null,
        message: '没有需要迁移的旧版数据',
      };
    }

    const newKey = getStorageKey(userId);
    const existingData = await loadFromStorage(newKey);

    let finalData: MoodEntry[];
    if (existingData.length > 0) {
      // 合并数据
      finalData = mergeEntries(existingData, legacyData, 'keep-first');
    } else {
      // 直接使用旧数据
      finalData = legacyData;
    }

    // 保存到新键
    await saveToStorage(newKey, finalData);
    
    // 删除旧键
    await removeFromStorage(LEGACY_STORAGE_KEY);

    return {
      success: true,
      data: finalData,
      message: `已迁移 ${legacyData.length} 条旧版数据`,
    };
  } catch (error) {
    console.error('迁移旧版数据失败:', error);
    return {
      success: false,
      data: null,
      message: '迁移失败',
    };
  }
};

/**
 * 检查是否存在游客数据
 */
export const checkGuestData = async (): Promise<MoodEntry[]> => {
  return loadFromStorage(GUEST_STORAGE_KEY);
};

/**
 * 将游客数据迁移到用户存储
 */
export const migrateGuestDataToUser = async (
  userId: string
): Promise<MigrationResult> => {
  try {
    const guestData = await checkGuestData();
    
    if (guestData.length === 0) {
      return {
        success: true,
        data: null,
        message: '没有游客数据需要迁移',
      };
    }

    const userKey = getStorageKey(userId);
    const existingUserData = await loadFromStorage(userKey);

    const mergedData = mergeEntries(existingUserData, guestData, 'keep-first');

    // 保存到用户存储
    await saveToStorage(userKey, mergedData);
    
    // 清除游客数据
    await removeFromStorage(GUEST_STORAGE_KEY);

    return {
      success: true,
      data: mergedData,
      message: `已迁移 ${guestData.length} 条游客数据`,
    };
  } catch (error) {
    console.error('迁移游客数据失败:', error);
    return {
      success: false,
      data: null,
      message: '迁移失败',
    };
  }
};

/**
 * 将用户数据合并到游客存储
 */
export const migrateUserDataToGuest = async (
  userId: string
): Promise<MigrationResult> => {
  try {
    const userKey = getStorageKey(userId);
    const userData = await loadFromStorage(userKey);
    
    if (userData.length === 0) {
      const guestData = await checkGuestData();
      return {
        success: true,
        data: guestData,
        message: '用户没有数据，保留游客数据',
      };
    }

    const guestData = await checkGuestData();
    const mergedData = mergeEntries(guestData, userData, 'keep-latest');

    // 保存到游客存储
    await saveToStorage(GUEST_STORAGE_KEY, mergedData);

    return {
      success: true,
      data: mergedData,
      message: `已合并 ${userData.length} 条用户数据到游客存储`,
    };
  } catch (error) {
    console.error('合并用户数据到游客存储失败:', error);
    return {
      success: false,
      data: null,
      message: '合并失败',
    };
  }
};
