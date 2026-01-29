/**
 * 存储抽象层
 * 提供统一的 AsyncStorage 操作接口
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 存储管理器
 * 封装 AsyncStorage 操作，提供统一的错误处理和类型安全
 */
export class StorageManager {
  /**
   * 读取数据
   * @param key 存储键
   * @param defaultValue 默认值
   * @returns 存储的数据或默认值
   */
  static async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data === null) {
        return defaultValue;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`读取存储失败 (${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * 保存数据
   * @param key 存储键
   * @param value 要保存的数据
   * @returns 是否保存成功
   */
  static async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`保存存储失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 删除数据
   * @param key 存储键
   * @returns 是否删除成功
   */
  static async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`删除存储失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param key 存储键
   * @returns 是否存在
   */
  static async has(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`检查存储失败 (${key}):`, error);
      return false;
    }
  }

  /**
   * 获取所有键
   * @returns 所有存储键的数组
   */
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('获取所有键失败:', error);
      return [];
    }
  }

  /**
   * 清空所有数据
   * @returns 是否清空成功
   */
  static async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('清空存储失败:', error);
      return false;
    }
  }
}
