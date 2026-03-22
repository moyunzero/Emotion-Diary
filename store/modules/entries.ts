/**
 * 条目管理模块
 * 负责情绪条目的增删改查操作及本地持久化
 */

// 防抖合并多次快速写入，减少 AsyncStorage 频繁 IO；与天气模块联动在落盘后重算。

import { StateCreator } from 'zustand';
import { EditHistory, MoodEntry, Status } from '../../types';
import {
  getStorageKey,
  loadFromStorage,
  migrateFromLegacyStorage,
  saveToStorage,
} from './storage';
import { AppStore, EntriesModule } from './types';

/** 防抖保存定时器（500ms），全应用单例 */
let saveEntriesTimeoutRef: ReturnType<typeof setTimeout> | null = null;

/**
 * 清除 entries 保存防抖定时器（供 cleanupStoreTimers 调用）
 */
export const clearEntriesSaveDebounce = (): void => {
  if (saveEntriesTimeoutRef) {
    clearTimeout(saveEntriesTimeoutRef);
    saveEntriesTimeoutRef = null;
  }
};

/**
 * 创建 entries slice（StateCreator 交叉类型，get 可访问 AppStore 其余字段）
 */
// addEntry 等路径会在内存更新后走 _saveEntries；云端同步由根 store 的 sync 方法单独触发。
export const createEntriesSlice: StateCreator<
  AppStore,
  [],
  [],
  EntriesModule
> = (set, get, _store) => ({
  entries: [],

  /**
   * 设置条目列表
   */
  _setEntries: (entries: MoodEntry[]) => {
    set({ entries });
  },

  /**
   * 添加新条目
   */
  addEntry: async (entryData): Promise<void> => {
    const newEntry: MoodEntry = {
      ...entryData,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: Status.ACTIVE,
    };

    const { entries } = get();
    const updatedEntries = [newEntry, ...entries];
    set({ entries: updatedEntries });

    // 更新 firstEntryDate（如果这是第一条记录或更早的记录）
    const store = get();
    if (store.updateFirstEntryDate) {
      await store.updateFirstEntryDate(newEntry.timestamp);
    }

    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 更新条目（支持编辑历史）
   */
  updateEntry: (id, updates): void => {
    const { entries } = get();
    const entry = entries.find((e) => e.id === id);

    if (!entry) {
      console.error('Entry not found:', id);
      return;
    }

    // 创建编辑历史记录
    const editHistory: EditHistory = {
      editedAt: Date.now(),
      previousContent: entry.content,
      previousMoodLevel: entry.moodLevel,
      previousDeadline: entry.deadline,
      previousPeople: [...entry.people],
      previousTriggers: [...entry.triggers],
    };

    // 限制编辑历史数量，防止内存泄漏
    const MAX_EDIT_HISTORY = 10;
    const currentHistory = entry.editHistory || [];
    const newHistory = [...currentHistory, editHistory].slice(-MAX_EDIT_HISTORY);

    // 更新条目
    const updatedEntries = entries.map((e) =>
      e.id === id
        ? {
            ...e,
            ...updates,
            editHistory: newHistory,
          }
        : e
    );

    set({ entries: updatedEntries });

    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 解决条目
   */
  resolveEntry: (id): void => {
    const { entries } = get();
    const updatedEntries = entries.map((e) =>
      e.id === id
        ? { ...e, status: Status.RESOLVED, resolvedAt: Date.now() }
        : e
    );
    set({ entries: updatedEntries });

    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 焚烧条目（标记为已焚烧，不真正删除）
   */
  burnEntry: (id): void => {
    const { entries } = get();
    const updatedEntries = entries.map((e) =>
      e.id === id
        ? { ...e, status: Status.BURNED, burnedAt: Date.now() }
        : e
    );
    set({ entries: updatedEntries });

    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 删除条目（真正删除，不保留任何痕迹）
   */
  deleteEntry: async (id): Promise<void> => {
    const { entries } = get();
    const updatedEntries = entries.filter((e) => e.id !== id);
    set({ entries: updatedEntries });

    // 如果删除后没有记录了，清除 firstEntryDate
    const store = get();
    if (updatedEntries.length === 0 && store.clearFirstEntryDate) {
      await store.clearFirstEntryDate();
    }

    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 加载本地条目（含迁移、loadFromStorage、_calculateWeather）
   */
  _loadEntries: async (): Promise<void> => {
    try {
      const { user } = get();
      const userId = user?.id || null;

      const migrationResult = await migrateFromLegacyStorage(userId);
      if (migrationResult.success && migrationResult.data) {
        set({ entries: migrationResult.data });
        get()._calculateWeather();
        return;
      }

      const storageKey = getStorageKey(userId);
      const entries = await loadFromStorage(storageKey);
      set({ entries });
      get()._calculateWeather();
    } catch (error) {
      console.error('Error loading entries:', error);
      set({ entries: [] });
    }
  },

  /**
   * 保存条目到本地（500ms 防抖）
   */
  _saveEntries: (): void => {
    if (saveEntriesTimeoutRef) {
      clearTimeout(saveEntriesTimeoutRef);
    }

    saveEntriesTimeoutRef = setTimeout(async () => {
      try {
        const { entries, user } = get();
        const storageKey = getStorageKey(user?.id || null);
        await saveToStorage(storageKey, entries);
      } catch (error) {
        console.error('Error saving entries:', error);
      } finally {
        saveEntriesTimeoutRef = null;
      }
    }, 500);
  },
});

/** @deprecated 使用 createEntriesSlice */
export const createEntriesModule = createEntriesSlice;
