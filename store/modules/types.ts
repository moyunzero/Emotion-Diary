/**
 * Store 模块类型定义
 * 将 Store 拆分为多个模块以提高可维护性
 */

import {
    EmotionForecast,
    EmotionPodcast,
    MoodEntry,
    User,
    WeatherState,
} from "../../types";

/**
 * 条目管理模块接口
 * 负责情绪条目的增删改查操作
 */
export interface EntriesModule {
  entries: MoodEntry[];
  addEntry: (
    entry: Omit<MoodEntry, "id" | "timestamp" | "status">,
  ) => Promise<void>;
  updateEntry: (
    id: string,
    updates: Partial<Omit<MoodEntry, "id" | "timestamp" | "editHistory">>,
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
 * 负责用户认证、资料管理和 firstEntryDate 追踪
 */
export interface UserModule {
  user: User | null;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
 * 负责本地数据与云端的双向同步
 */
export interface SyncModule {
  syncStatus: "idle" | "syncing" | "pending" | "error";
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  recoverFromCloud: () => Promise<boolean>;
}

/**
 * 天气状态模块接口
 * 负责计算和管理基于情绪条目的天气状态
 */
export interface WeatherModule {
  weather: WeatherState;
  _setWeather: (weather: WeatherState) => void;
  _calculateWeather: () => void;
}

/**
 * AI 功能模块接口
 * 负责情绪预测和播客生成
 */
export interface AIModule {
  emotionForecast: EmotionForecast | null;
  emotionPodcast: EmotionPodcast | null;
  generateForecast: (days?: number) => Promise<void>;
  generatePodcast: (period?: "week" | "month") => Promise<void>;
  clearForecast: () => void;
  clearPodcast: () => void;
}

/**
 * 完整的应用状态接口
 * 组合所有模块的状态和方法
 */
export interface AppState
  extends EntriesModule, UserModule, SyncModule, WeatherModule, AIModule {}

/**
 * 向后兼容的别名
 * @deprecated 使用 AppState 代替
 */
export type AppStore = AppState;

/**
 * 类型安全的模块创建器签名
 * 使用 Zustand 的 StateCreator 类型来确保 set 和 get 函数的类型安全
 *
 * @template T - 模块接口类型（如 EntriesModule, WeatherModule 等）
 *
 * 泛型参数说明：
 * - AppState: 完整的应用状态类型
 * - []: 中间件数组（当前未使用中间件）
 * - []: 存储修改器数组（当前未使用修改器）
 * - T: 当前模块的状态和方法类型
 *
 * Note: StateCreator 返回一个函数，该函数接收 (set, get, store) 三个参数
 * 但在实际使用中，我们只需要 set 和 get，store 参数会被 Zustand 自动提供
 */
export type ModuleCreator<T> = (
  set: (
    partial: Partial<AppState> | ((state: AppState) => Partial<AppState>),
  ) => void,
  get: () => AppState,
) => T;
