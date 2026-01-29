/**
 * Store 模块类型定义
 * 将 Store 拆分为多个模块以提高可维护性
 */

import { EmotionForecast, EmotionPodcast, MoodEntry, User, WeatherState } from '../../types';

/**
 * 条目管理模块接口
 */
export interface EntriesModule {
  entries: MoodEntry[];
  addEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateEntry: (
    id: string,
    updates: Partial<Omit<MoodEntry, 'id' | 'timestamp' | 'editHistory'>>
  ) => void;
  resolveEntry: (id: string) => void;
  burnEntry: (id: string) => void;
  deleteEntry: (id: string) => Promise<void>;
  _setEntries: (entries: MoodEntry[]) => void;
  _loadEntries: () => Promise<void>;
  _saveEntries: () => void;
}

/**
 * 用户管理模块接口
 */
export interface UserModule {
  user: User | null;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  _setUser: (user: User | null) => void;
  _loadUser: () => Promise<void>;
  
  // firstEntryDate 管理方法
  initializeFirstEntryDate: () => Promise<void>;
  updateFirstEntryDate: (timestamp: number) => Promise<void>;
  clearFirstEntryDate: () => Promise<void>;
  _syncFirstEntryDateToCloud: () => Promise<void>;
  _syncFirstEntryDateFromCloud: () => Promise<void>;
}

/**
 * 同步管理模块接口
 */
export interface SyncModule {
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  recoverFromCloud: () => Promise<boolean>;
}

/**
 * 天气状态模块接口
 */
export interface WeatherModule {
  weather: WeatherState;
  _setWeather: (weather: WeatherState) => void;
  _calculateWeather: () => void;
}

/**
 * AI 功能模块接口
 */
export interface AIModule {
  emotionForecast: EmotionForecast | null;
  emotionPodcast: EmotionPodcast | null;
  generateForecast: (days?: number) => Promise<void>;
  generatePodcast: (period?: 'week' | 'month') => Promise<void>;
  clearForecast: () => void;
  clearPodcast: () => void;
}

/**
 * 完整的 Store 接口
 */
export interface AppStore
  extends EntriesModule,
    UserModule,
    SyncModule,
    WeatherModule,
    AIModule {}
