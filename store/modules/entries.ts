/**
 * 条目管理模块
 * 负责情绪条目的增删改查操作
 */

import { EditHistory, MoodEntry, Status } from '../../types';
import { EntriesModule, ModuleCreator } from './types';

/**
 * 创建条目管理模块
 */
export const createEntriesModule: ModuleCreator<EntriesModule> = (set, get) => ({
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
   * 加载本地条目（占位符，实际实现在主 Store 中）
   */
  _loadEntries: async (): Promise<void> => {
    // 实现在主 Store 中
  },

  /**
   * 保存条目到本地（占位符，实际实现在主 Store 中）
   */
  _saveEntries: (): void => {
    // 实现在主 Store 中
  },
});
