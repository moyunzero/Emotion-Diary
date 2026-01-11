import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { EditHistory, EmotionForecast, EmotionPodcast, MoodEntry, Status, User, WeatherState } from '../types';
import { generateEmotionPodcast, predictEmotionTrend } from '../utils/aiService';
import { ensureMilliseconds } from '../utils/dateUtils';

/**
 * Zustand Store 接口定义
 * 用于替代原来的 Context API，提供更好的性能和可维护性
 */
interface AppStore {
  // 状态
  entries: MoodEntry[];
  user: User | null;
  weather: WeatherState;
  emotionForecast: EmotionForecast | null;
  emotionPodcast: EmotionPodcast | null;
  
  // 操作方法
  addEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => void;
  updateEntry: (id: string, updates: Partial<Omit<MoodEntry, 'id' | 'timestamp' | 'editHistory'>>) => void;
  resolveEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  recoverFromCloud: () => Promise<boolean>;
  
  // AI相关方法
  generateForecast: (days?: number) => Promise<void>;
  generatePodcast: (period?: 'week' | 'month') => Promise<void>;
  clearForecast: () => void;
  clearPodcast: () => void;
  
  // 内部方法（不对外暴露）
  _setEntries: (entries: MoodEntry[]) => void;
  _setUser: (user: User | null) => void;
  _setWeather: (weather: WeatherState) => void;
  _loadEntries: () => Promise<void>;
  _loadUser: () => Promise<void>;
  _calculateWeather: () => void;
  _saveEntries: () => void;
}

// 同步操作互斥锁，防止竞态条件
let isSyncingRef = false;

// AsyncStorage写入防抖定时器
let saveEntriesTimeoutRef: ReturnType<typeof setTimeout> | null = null;

// 旧版本存储键（用于兼容迁移）
const LEGACY_STORAGE_KEY = 'mood_entries';
// 游客数据存储键
const GUEST_STORAGE_KEY = 'mood_entries_guest';

/**
 * 根据用户ID生成存储键
 * @param userId 用户ID，为null时返回游客存储键
 * @returns 对应的存储键
 */
const getStorageKey = (userId: string | null): string => {
  return userId ? `mood_entries_${userId}` : GUEST_STORAGE_KEY;
};

/**
 * 检查并迁移旧版本数据
 * 如果存在旧的 mood_entries 键，根据当前用户状态迁移到对应的新键
 * @param userId 当前用户ID，为null表示未登录
 * @returns 迁移的数据（如果有），否则返回null
 */
const migrateFromLegacyStorage = async (userId: string | null): Promise<MoodEntry[] | null> => {
  try {
    const legacyData = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyData) {
      return null;
    }
    
    const parsedData = JSON.parse(legacyData) as MoodEntry[];
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      // 旧数据为空，直接删除旧键
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      return null;
    }
    
    // 获取新存储键
    const newKey = getStorageKey(userId);
    
    // 检查新键是否已有数据
    const existingData = await AsyncStorage.getItem(newKey);
    
    if (existingData) {
      // 新键已有数据，需要合并
      const existingEntries = JSON.parse(existingData) as MoodEntry[];
      const mergedMap = new Map<string, MoodEntry>();
      
      // 先添加现有数据
      existingEntries.forEach(entry => mergedMap.set(entry.id, entry));
      
      // 合并旧数据（只添加新键中不存在的条目）
      parsedData.forEach(entry => {
        if (!mergedMap.has(entry.id)) {
          mergedMap.set(entry.id, entry);
        }
      });
      
      const mergedEntries = Array.from(mergedMap.values());
      mergedEntries.sort((a, b) => b.timestamp - a.timestamp);
      
      // 保存合并后的数据到新键
      await AsyncStorage.setItem(newKey, JSON.stringify(mergedEntries));
      
      // 删除旧键
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      
      console.log(`已将旧版数据迁移并合并到 ${newKey}，共 ${mergedEntries.length} 条记录`);
      return mergedEntries;
    } else {
      // 新键没有数据，直接迁移
      await AsyncStorage.setItem(newKey, JSON.stringify(parsedData));
      
      // 删除旧键
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      
      console.log(`已将旧版数据迁移到 ${newKey}，共 ${parsedData.length} 条记录`);
      return parsedData;
    }
  } catch (error) {
    console.error('迁移旧版数据失败:', error);
    return null;
  }
};

/**
 * 检查是否存在游客数据
 * @returns 游客数据数组（如果存在），否则返回null
 */
const checkGuestData = async (): Promise<MoodEntry[] | null> => {
  try {
    const guestData = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    if (!guestData) {
      return null;
    }
    
    const parsedData = JSON.parse(guestData) as MoodEntry[];
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error('检查游客数据失败:', error);
    return null;
  }
};

/**
 * 将用户数据合并到游客存储
 * @param userId 用户ID
 * @returns 合并后的游客数据
 */
const migrateUserDataToGuest = async (userId: string): Promise<MoodEntry[] | null> => {
  try {
    const userKey = getStorageKey(userId);
    const userData = await AsyncStorage.getItem(userKey);
    
    if (!userData) {
      // 用户没有数据，直接返回游客数据（如果有）
      return await checkGuestData();
    }
    
    const userEntries = JSON.parse(userData) as MoodEntry[];
    if (!Array.isArray(userEntries) || userEntries.length === 0) {
      // 用户数据为空，直接返回游客数据（如果有）
      return await checkGuestData();
    }
    
    // 获取游客数据
    const guestData = await checkGuestData();
    
    let mergedEntries: MoodEntry[];
    
    if (guestData && guestData.length > 0) {
      // 游客已有数据，合并（使用 ID 去重，保留最新的版本）
      const mergedMap = new Map<string, MoodEntry>();
      
      // 先添加游客数据
      guestData.forEach(entry => mergedMap.set(entry.id, entry));
      
      // 合并用户数据（如果 ID 相同，保留时间戳更新的版本）
      userEntries.forEach(entry => {
        const existingEntry = mergedMap.get(entry.id);
        if (!existingEntry) {
          // 游客数据中没有，直接添加
          mergedMap.set(entry.id, entry);
        } else {
          // 游客数据中已有，比较时间戳，保留更新的版本
          if (entry.timestamp > existingEntry.timestamp) {
            mergedMap.set(entry.id, entry);
          }
        }
      });
      
      mergedEntries = Array.from(mergedMap.values());
      mergedEntries.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      // 游客没有数据，直接使用用户数据
      mergedEntries = userEntries;
    }
    
    // 保存到游客存储
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(mergedEntries));
    
    console.log(`已将用户数据合并到游客存储，共 ${mergedEntries.length} 条记录`);
    return mergedEntries;
  } catch (error) {
    console.error('合并用户数据到游客存储失败:', error);
    return null;
  }
};

/**
 * 将游客数据迁移到用户存储
 * @param userId 用户ID
 * @returns 迁移后的数据
 */
const migrateGuestDataToUser = async (userId: string): Promise<MoodEntry[] | null> => {
  try {
    const guestData = await checkGuestData();
    if (!guestData) {
      return null;
    }
    
    const userKey = getStorageKey(userId);
    const existingUserData = await AsyncStorage.getItem(userKey);
    
    let mergedEntries: MoodEntry[];
    
    if (existingUserData) {
      // 用户已有数据，合并
      const existingEntries = JSON.parse(existingUserData) as MoodEntry[];
      const mergedMap = new Map<string, MoodEntry>();
      
      // 先添加用户现有数据
      existingEntries.forEach(entry => mergedMap.set(entry.id, entry));
      
      // 合并游客数据（只添加用户数据中不存在的条目）
      guestData.forEach(entry => {
        if (!mergedMap.has(entry.id)) {
          mergedMap.set(entry.id, entry);
        }
      });
      
      mergedEntries = Array.from(mergedMap.values());
      mergedEntries.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      // 用户没有数据，直接使用游客数据
      mergedEntries = guestData;
    }
    
    // 保存到用户存储
    await AsyncStorage.setItem(userKey, JSON.stringify(mergedEntries));
    
    // 清除游客数据
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    
    console.log(`已将游客数据迁移到用户存储，共 ${mergedEntries.length} 条记录`);
    return mergedEntries;
  } catch (error) {
    console.error('迁移游客数据到用户存储失败:', error);
    return null;
  }
};

/**
 * 获取用户友好的错误消息
 */
const getErrorMessage = (error: any): string => {
  if (!error) return '操作失败，请稍后重试';
  
  const errorMessage = error.message || error.toString();
  
  // 网络相关错误
  if (errorMessage.includes('Network') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return '网络连接失败，请检查网络设置';
  }
  
  // 认证相关错误
  if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid')) {
    return '邮箱或密码错误，请重新输入';
  }
  
  if (errorMessage.includes('User already registered')) {
    return '该邮箱已被注册';
  }
  
  if (errorMessage.includes('Email rate limit')) {
    return '请求过于频繁，请稍后再试';
  }
  
  // 数据库相关错误
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    return '数据库表不存在，请联系管理员';
  }
  
  // 主键冲突错误（记录已存在）
  if (error.code === '23505' || errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
    return '记录已存在，将尝试更新';
  }
  
  // RLS (Row Level Security) 策略错误
  if (error.code === '42501' || errorMessage.includes('row-level security') || errorMessage.includes('violates row-level security policy')) {
    return '数据库权限配置错误，请联系管理员检查行级安全策略';
  }
  
  if (errorMessage.includes('permission denied') || errorMessage.includes('PGRST')) {
    return '权限不足，请检查账号状态';
  }
  
  // 超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return '请求超时，请检查网络连接';
  }
  
  // 默认错误消息
  return errorMessage.length > 50 ? '操作失败，请稍后重试' : errorMessage;
};

/**
 * 初始化数据库表结构
 * 添加错误处理，防止初始化失败导致应用崩溃
 */
const initializeDatabase = async () => {
  // 如果 Supabase 未配置，跳过数据库初始化
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过数据库初始化');
    return;
  }

  try {
    // 检查profiles表是否存在
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (checkError) {
      // 如果是表不存在错误，只记录警告，不抛出异常
      if (checkError.message && checkError.message.includes('relation "public.profiles" does not exist')) {
        console.log('Profiles table does not exist. Please execute the SQL script in Supabase SQL Editor to create it.');
        console.log('You can find the script in /supabase/setup_profiles.sql');
      } else {
        // 其他错误（如网络错误）也记录但不抛出，允许应用继续运行
        console.warn('Database initialization check failed:', checkError.message);
      }
    }
  } catch (error) {
    // 捕获所有异常，防止应用崩溃
    console.error('Database initialization error:', error);
    // 不重新抛出错误，允许应用以离线模式继续运行
  }
};

/**
 * 创建 Zustand Store
 * 使用 create 函数创建 store，包含所有状态和操作方法
 */
export const useAppStore = create<AppStore>((set, get) => ({
  // 初始状态
  entries: [],
  user: null,
  weather: {
    score: 0,
    condition: 'sunny',
    description: '关系晴朗'
  },
  emotionForecast: null,
  emotionPodcast: null,

  // 设置状态的方法（内部使用）
  _setEntries: (entries) => set({ entries }),
  _setUser: (user) => set({ user }),
  _setWeather: (weather) => set({ weather }),

  /**
   * 加载本地条目
   * 根据当前用户状态使用对应的存储键（用户隔离策略）
   */
  _loadEntries: async () => {
    try {
      const { user } = get();
      const userId = user?.id || null;
      
      // 首先检查是否需要迁移旧版数据
      const migratedData = await migrateFromLegacyStorage(userId);
      if (migratedData) {
        // 如果有迁移的数据，直接使用
        set({ entries: migratedData });
        get()._calculateWeather();
        return;
      }
      
      // 使用用户特定的存储键加载数据
      const storageKey = getStorageKey(userId);
      const saved = await AsyncStorage.getItem(storageKey);
      
      if (saved) {
        const parsedEntries = JSON.parse(saved);
        set({ entries: parsedEntries });
      } else {
        // 本地没有数据，显示空数组
        set({ entries: [] });
      }
      
      // 加载后重新计算天气
      get()._calculateWeather();
    } catch (error) {
      console.error('Error loading entries:', error);
      set({ entries: [] });
    }
  },

  /**
   * 保存条目到本地（带防抖，避免频繁写入）
   * 使用用户特定的存储键，确保数据隔离
   */
  _saveEntries: () => {
    // 清除之前的定时器
    if (saveEntriesTimeoutRef) {
      clearTimeout(saveEntriesTimeoutRef);
    }
    
    // 设置新的定时器，500ms后执行保存
    saveEntriesTimeoutRef = setTimeout(async () => {
      try {
        const { entries, user } = get();
        // 使用用户特定的存储键
        const storageKey = getStorageKey(user?.id || null);
        await AsyncStorage.setItem(storageKey, JSON.stringify(entries));
      } catch (error) {
        console.error('Error saving entries:', error);
      } finally {
        saveEntriesTimeoutRef = null;
      }
    }, 500);
  },

  /**
   * 计算天气状态
   */
  _calculateWeather: () => {
    const { entries } = get();
    // 简单算法：活跃情绪记录的情绪等级总和
    const activeEntries = entries.filter(e => e.status === Status.ACTIVE);
    const score = activeEntries.reduce((acc, curr) => acc + curr.moodLevel * 2, 0);
    
    let condition: WeatherState['condition'] = 'sunny';
    let description = '相处不错哦~';

    if (score > 30) {
      condition = 'stormy';
      description = '预警！关系需要紧急维护！';
    } else if (score > 20) {
      condition = 'rainy';
      description = '建议安排一次深度沟通';
    } else if (score > 10) {
      condition = 'cloudy';
      description = '有些小情绪，需要关注';
    }

    set({ weather: { score, condition, description } });
  },

  /**
   * 加载用户信息
   */
  _loadUser: async () => {
    try {
      // 检查当前会话
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // 先使用用户元数据创建用户对象
        let userData: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '情绪旅者',
          email: session.user.email || '',
          avatar: session.user.user_metadata?.avatar || 'https://picsum.photos/100/100',
        };
        
        // 尝试获取profile信息，但不阻塞加载流程
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!profileError && profile) {
            // 如果找到profile，更新用户信息
            userData = {
              ...userData,
              name: profile.name || userData.name,
              avatar: profile.avatar || userData.avatar,
            };
          } else if (profileError && profileError.code === 'PGRST116') {
            // 如果是"未找到行"错误，尝试创建profile
            console.log('Profile not found in loadUser, creating new profile...');
            const newProfile = {
              id: session.user.id,
              name: userData.name,
              email: userData.email,
              avatar: userData.avatar,
              updated_at: new Date().toISOString(),
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
            
            if (insertError) {
              console.error('Profile creation error in loadUser:', insertError);
              // 如果创建失败，检查是否是表不存在的错误
              if (insertError.message && insertError.message.includes('relation "public.profiles" does not exist')) {
                console.log('Profiles table does not exist, user data will be stored in metadata only');
              }
            }
          } else if (profileError) {
            // 其他profile错误
            console.error('Profile fetch error in loadUser:', profileError);
          }
        } catch (err) {
          console.error('Profile operation exception in loadUser:', err);
          // 如果整个profiles操作失败，继续使用元数据中的用户信息
        }
        
        set({ user: userData });
        // 用户已登录，加载本地条目
        get()._loadEntries();
      } else {
        // 用户未登录，清除用户状态，但保留本地数据
        set({ user: null });
        // 清除可能存在的旧版游客数据
        const savedUser = await AsyncStorage.getItem('user_session');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            // 如果存在旧版游客数据（temp_user_ 开头），清除它
            if (parsedUser.id && parsedUser.id.startsWith('temp_user_')) {
              await AsyncStorage.removeItem('user_session');
            }
          } catch {
            // 忽略解析错误，直接清除
            await AsyncStorage.removeItem('user_session');
          }
        }
        // 未登录时也加载本地数据（本地优先策略）
        get()._loadEntries();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // 出错时清除用户状态，但保留本地数据
      set({ user: null });
      get()._loadEntries();
    }
  },

  /**
   * 添加新条目
   */
  addEntry: (entryData) => {
    const newEntry: MoodEntry = {
      ...entryData,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: Status.ACTIVE,
    };
    
    const { entries } = get();
    const updatedEntries = [newEntry, ...entries];
    set({ entries: updatedEntries });
    
    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 更新条目（支持编辑历史）
   */
  updateEntry: (id, updates) => {
    const { entries } = get();
    const entry = entries.find(e => e.id === id);
    
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
    
    // 更新条目，保留原有编辑历史并添加新记录
    const updatedEntries = entries.map(e => 
      e.id === id 
        ? { 
            ...e, 
            ...updates,
            editHistory: [...(e.editHistory || []), editHistory],
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
  resolveEntry: (id) => {
    const { entries } = get();
    const updatedEntries = entries.map(e => 
      e.id === id ? { ...e, status: Status.RESOLVED, resolvedAt: Date.now() } : e
    );
    set({ entries: updatedEntries });
    
    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 删除条目
   */
  deleteEntry: (id) => {
    const { entries } = get();
    const updatedEntries = entries.filter(e => e.id !== id);
    set({ entries: updatedEntries });
    
    // 保存到本地并重新计算天气
    get()._saveEntries();
    get()._calculateWeather();
  },

  /**
   * 用户注册
   */
  register: async (email, password, name) => {
    try {
      // 使用Supabase注册用户，确保用户名传递到元数据
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            display_name: name // 添加显示名称字段以确保用户名正确存储
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        // 检查是否是用户已注册的错误
        if (error.message.includes('User already registered')) {
          console.log('User already registered, attempting to switch to login mode');
          throw new Error('User already registered');
        }
        return false;
      }
      
      // 注册成功，直接尝试登录
      if (data.user) {
        return await get().login(email, password);
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      // 如果是用户已注册的错误，重新抛出以便UI层处理
      if (error.message && error.message.includes('User already registered')) {
        throw error;
      }
      return false;
    }
  },

  /**
   * 用户登录
   * 登录成功后会自动检查并迁移游客数据
   */
  login: async (email: string, password: string) => {
    try {
      if (!email || !password) {
        console.error('邮箱和密码不能为空');
        return false;
      }
      
      // 用户登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('登录失败:', error.message);
        return false;
      }
      
      if (data.user) {
        // 先使用用户元数据创建用户对象
        let userData = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || '情绪旅人',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar || 'https://picsum.photos/100/100',
        };
        
        // 尝试从profiles表获取用户信息
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (!profileError && profile) {
            // 如果找到profile，使用profile中的信息
            userData = {
              ...userData,
              name: profile.name || userData.name,
              avatar: profile.avatar || userData.avatar,
            };
          } else if (profileError && profileError.code === 'PGRST116') {
            // 如果是"未找到行"错误，尝试创建profile
            console.log('Profile not found, creating new profile...');
            const newProfile = {
              id: data.user.id,
              name: userData.name,
              email: userData.email,
              avatar: userData.avatar,
              updated_at: new Date().toISOString(),
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
            
            if (insertError) {
              console.error('Profile creation error:', insertError);
              // 如果创建失败，检查是否是表不存在的错误
              if (insertError.message && insertError.message.includes('relation "public.profiles" does not exist')) {
                console.log('Profiles table does not exist, user data will be stored in metadata only');
              } else {
                // 其他错误，可能是权限问题
                console.error('Other profile creation error:', insertError);
              }
            }
          } else if (profileError) {
            // 其他profile错误
            console.error('Profile fetch error:', profileError);
          }
        } catch (err) {
          console.error('Profile operation exception:', err);
          // 如果整个profiles操作失败，继续使用元数据中的用户信息
        }
        
        // 检查是否是用户切换（从账号1切换到账号2）
        const { user: currentUser } = get();
        const isUserSwitching = currentUser && currentUser.id !== userData.id;
        
        if (isUserSwitching) {
          console.log('检测到用户切换，清除旧账号数据');
          // 先清除 store 中的 entries，避免旧账号数据残留
          set({ entries: [] });
        }
        
        // 设置用户状态（这样后续的 _loadEntries 才能使用正确的存储键）
        set({ user: userData });
        await AsyncStorage.setItem('user_session', JSON.stringify(userData));
        
        // 检查是否有游客数据需要迁移
        const guestData = await checkGuestData();
        if (guestData && guestData.length > 0) {
          console.log(`发现 ${guestData.length} 条游客数据，正在迁移到用户账号...`);
          const migratedEntries = await migrateGuestDataToUser(userData.id);
          if (migratedEntries) {
            set({ entries: migratedEntries });
            get()._calculateWeather();
            console.log('游客数据迁移成功');
          }
        } else {
          // 没有游客数据，加载用户专属存储的数据
          await get()._loadEntries();
        }
        
        // 登录成功后，只加载本地数据，不自动同步云端数据
        // 用户需要主动点击"找回回忆"才会同步云端数据
        // 这样可以确保本地数据不会被覆盖
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  /**
   * 用户登出
   * 清除用户登录状态，将用户数据合并到游客存储，确保退出后仍能看到数据
   * 符合"本地优先"的设计理念
   */
  logout: async () => {
    try {
      const { user, entries } = get();
      
      if (!user) {
        // 如果没有登录用户，直接清除状态并加载游客数据
        set({ user: null });
        await AsyncStorage.removeItem('user_session');
        await get()._loadEntries();
        return;
      }
      
      // 先确保当前数据已保存到用户专属存储（同步保存，不使用防抖）
      if (entries.length > 0) {
        const userKey = getStorageKey(user.id);
        await AsyncStorage.setItem(userKey, JSON.stringify(entries));
        console.log(`已保存 ${entries.length} 条数据到用户专属存储`);
      }
      
      // 在登出前，将用户数据合并到游客存储，确保退出后仍能看到数据
      // 这会读取刚才保存的用户数据，并与游客数据合并
      const mergedGuestData = await migrateUserDataToGuest(user.id);
      
      // 从Supabase登出
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      // 清除用户登录状态
      set({ user: null });
      await AsyncStorage.removeItem('user_session');
      
      // 如果合并成功，更新当前显示的数据
      if (mergedGuestData && mergedGuestData.length > 0) {
        set({ entries: mergedGuestData });
        get()._calculateWeather();
        console.log(`退出登录：已将用户数据合并到游客存储，共 ${mergedGuestData.length} 条记录`);
      } else {
        // 如果没有合并的数据，加载游客存储的数据
        await get()._loadEntries();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // 即使出错，也要清除用户状态并加载游客数据
      set({ user: null });
      await AsyncStorage.removeItem('user_session');
      await get()._loadEntries();
    }
  },

  /**
   * 更新用户信息
   */
  updateUser: async (updates) => {
    const { user } = get();
    if (!user) return;
    
    try {
      // 更新Supabase profiles表
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
      
      const updatedUser = { ...user, ...updates };
      set({ user: updatedUser });
      // 同时更新本地存储
      await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * 同步到云端
   */
  syncToCloud: async () => {
    const { user, entries } = get();
    
    if (!user) {
      console.error('用户未登录');
      return false;
    }
    
    // 检查是否正在同步，防止竞态条件
    if (isSyncingRef) {
      console.warn('同步操作正在进行中，请稍后再试');
      return false;
    }
    
    isSyncingRef = true;
    
    try {
      // 验证用户 ID 是否为有效的 UUID 格式
      if (!user.id || typeof user.id !== 'string') {
        throw new Error('用户 ID 无效，请重新登录');
      }
      
      // 验证 Supabase 认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError);
        throw new Error('认证状态验证失败，请重新登录');
      }
      
      if (!session || !session.user) {
        console.error('当前没有有效的用户会话');
        console.error('用户对象:', user);
        throw new Error('用户未正确认证，请重新登录');
      }
      
      // 验证用户 ID 是否匹配
      if (session.user.id !== user.id) {
        console.error('用户 ID 不匹配:', {
          sessionUserId: session.user.id,
          storeUserId: user.id
        });
        throw new Error('用户身份验证失败，请重新登录');
      }
      
      console.log('认证验证通过:', {
        userId: session.user.id,
        email: session.user.email,
        authenticated: !!session
      });
      
      // 使用 session 的用户ID，确保数据隔离（不依赖 store 中的 user.id）
      const currentUserId = session.user.id;
      
      // 准备要上传的数据，显式指定所有字段（注意列名大小写）
      // 确保所有条目的 user_id 都使用当前 session 的用户ID
      const entriesToSync = entries.map(entry => {
        // 确保数组字段不为 null
        const peopleArray = Array.isArray(entry.people) ? entry.people : [];
        const triggersArray = Array.isArray(entry.triggers) ? entry.triggers : [];
        
        return {
          id: entry.id,
          timestamp: entry.timestamp,
          moodlevel: entry.moodLevel || 1, // 数据库中的列名是小写，确保不为NULL
          content: entry.content || '', // 确保不为 null
          deadline: entry.deadline || 'later', // 确保不为 null
          people: peopleArray, // 确保是数组
          triggers: triggersArray, // 确保是数组
          status: entry.status || 'active', // 确保不为 null
          resolvedat: entry.resolvedAt || null, // 可选字段
          user_id: currentUserId // 使用 session 的用户ID，确保数据隔离
        };
      });
      
      // 调试：打印第一条数据用于检查
      if (entriesToSync.length > 0) {
        console.log('准备同步的数据示例（第一条）:', JSON.stringify(entriesToSync[0], null, 2));
        console.log('用户 ID:', currentUserId, '类型:', typeof currentUserId);
      }
      
      // 验证所有要上传的数据的 user_id 是否与当前用户ID匹配
      const invalidEntries = entriesToSync.filter(e => e.user_id !== currentUserId);
      if (invalidEntries.length > 0) {
        console.error('发现 user_id 不匹配的数据:', invalidEntries.length, '条');
        console.error('当前用户 ID:', currentUserId);
        console.error('不匹配的数据示例:', invalidEntries[0]);
        throw new Error('数据验证失败：存在 user_id 不匹配的记录');
      }
      
      // 获取云端现有数据，用于对比
      // 注意：只获取当前用户的数据，避免跨用户数据冲突
      const { data: existingCloudData, error: fetchError } = await supabase
        .from('entries')
        .select('id, user_id')
        .eq('user_id', currentUserId);
      
      if (fetchError) {
        console.warn('获取云端现有数据失败，将使用全量同步策略:', fetchError);
      }
      
      // 创建本地数据的ID集合
      const localIds = new Set(entriesToSync.map(e => e.id));
      
      // 找出需要删除的记录（云端有但本地没有，且属于当前用户）
      const idsToDelete: string[] = [];
      if (existingCloudData) {
        existingCloudData.forEach(cloudEntry => {
          // 双重检查：确保 user_id 匹配，防止跨用户数据冲突
          // 使用 session 的用户ID进行验证
          const entryUserId = cloudEntry.user_id;
          if (!localIds.has(cloudEntry.id) && entryUserId === currentUserId) {
            idsToDelete.push(cloudEntry.id);
          }
        });
      }
      
      // 执行删除操作（只删除本地不存在的记录，且确保是当前用户的数据）
      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('entries')
          .delete()
          .in('id', idsToDelete)
          .eq('user_id', currentUserId); // 使用 session 的用户ID，确保安全
        
        if (deleteError) {
          console.error('删除云端多余数据失败:', deleteError);
          // 删除失败不影响上传，继续执行
        } else {
          console.log(`已删除云端 ${idsToDelete.length} 条本地不存在的记录`);
        }
      }
      
      // 将同步操作拆分为 INSERT 和 UPDATE，避免跨用户数据冲突
      // 这样可以更安全地处理 RLS 策略
      if (entriesToSync.length > 0) {
        // 数据验证已在前面完成，这里不需要重复验证
        
        // 分离新记录和已存在的记录
        const existingIds = new Set(
          existingCloudData ? existingCloudData.map(e => e.id) : []
        );
        
        const newEntries = entriesToSync.filter(e => !existingIds.has(e.id));
        const updateEntries = entriesToSync.filter(e => existingIds.has(e.id));
        
        console.log(`准备同步：${newEntries.length} 条新记录，${updateEntries.length} 条更新记录`);
        
        // 先插入新记录
        if (newEntries.length > 0) {
          // 尝试批量插入，如果失败则逐个处理
          const { error: insertError } = await supabase
            .from('entries')
            .insert(newEntries);
          
          if (insertError) {
            // 检查是否是主键冲突错误（23505）
            // 这表示记录已存在，但由于 RLS 策略，我们无法查询到它们
            if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
              console.warn('批量插入时发现主键冲突，将逐个处理记录');
              
              // 逐个插入，处理冲突
              const successfulInserts: typeof newEntries = [];
              const conflictedEntries: typeof newEntries = [];
              
              for (const entry of newEntries) {
                const { error: singleInsertError } = await supabase
                  .from('entries')
                  .insert([entry]);
                
                if (singleInsertError) {
                  if (singleInsertError.code === '23505' || singleInsertError.message?.includes('duplicate key')) {
                    // 主键冲突：记录已存在，尝试更新
                    console.log(`记录 ${entry.id} 已存在，将尝试更新`);
                    conflictedEntries.push(entry);
                  } else {
                    // 其他错误（如 RLS 错误）
                    const errorMsg = getErrorMessage(singleInsertError);
                    console.error(`插入记录 ${entry.id} 失败:`, errorMsg);
                    
                    // 如果是 RLS 错误，也尝试更新（可能是记录存在但属于当前用户）
                    if (singleInsertError.code === '42501' || singleInsertError.message?.includes('row-level security')) {
                      console.warn(`记录 ${entry.id} 插入被 RLS 阻止，将尝试更新`);
                      conflictedEntries.push(entry);
                    } else {
                      // 其他错误，跳过这条记录
                      console.warn(`跳过记录 ${entry.id}，原因: ${errorMsg}`);
                    }
                  }
                } else {
                  successfulInserts.push(entry);
                }
              }
              
              if (successfulInserts.length > 0) {
                console.log(`成功插入 ${successfulInserts.length} 条新记录`);
              }
              
              if (conflictedEntries.length > 0) {
                console.warn(`发现 ${conflictedEntries.length} 条冲突记录，将尝试更新`);
                // 将冲突的记录添加到更新列表
                updateEntries.push(...conflictedEntries);
              }
            } else {
              // 其他错误（如 RLS 策略错误）
              const errorMsg = getErrorMessage(insertError);
              console.error('插入新记录失败:', errorMsg, insertError);
              
              // 检查是否是 RLS 策略错误
              if (insertError.code === '42501' || insertError.message?.includes('row-level security')) {
                console.error('INSERT 操作被 RLS 策略阻止');
                console.error('可能原因：user_id 与 auth.uid() 不匹配');
              }
              
              throw new Error(`插入新记录失败: ${errorMsg}`);
            }
          } else {
            console.log(`成功插入 ${newEntries.length} 条新记录`);
          }
        }
        
        // 再更新已存在的记录（只更新属于当前用户的记录）
        if (updateEntries.length > 0) {
          // 使用批量更新，但每条记录单独更新以确保 RLS 策略正确应用
          let successCount = 0;
          let failCount = 0;
          const errors: any[] = [];
          
          for (const entry of updateEntries) {
            const { error: updateError } = await supabase
              .from('entries')
              .update({
                timestamp: entry.timestamp,
                moodlevel: entry.moodlevel || 1,
                content: entry.content || '',
                deadline: entry.deadline || 'later',
                people: entry.people || [],
                triggers: entry.triggers || [],
                status: entry.status || 'active',
                resolvedat: entry.resolvedat || null,
              })
              .eq('id', entry.id)
              .eq('user_id', currentUserId); // 使用 session 的用户ID，确保只更新当前用户的记录
            
            if (updateError) {
              failCount++;
              errors.push({ id: entry.id, error: updateError });
              
              // 如果是 RLS 错误，记录详细信息
              if (updateError.code === '42501' || updateError.message?.includes('row-level security')) {
                console.warn(`记录 ${entry.id} 更新失败（RLS 策略阻止）:`, updateError.message);
                console.warn('这可能是因为该记录不属于当前用户');
              }
            } else {
              successCount++;
            }
          }
          
          if (failCount > 0) {
            console.warn(`更新记录时部分失败: ${successCount} 成功，${failCount} 失败`);
            console.warn('失败的记录:', errors);
            
            // 如果所有更新都失败，抛出错误
            if (successCount === 0) {
              throw new Error(`所有记录更新失败，可能是 RLS 策略问题`);
            }
          } else {
            console.log(`成功更新 ${updateEntries.length} 条记录`);
          }
        }
        
        console.log('成功同步', entries.length, '条记录到云端');
        return true;
      } else {
        // 本地没有数据，删除云端所有数据
        if (existingCloudData && existingCloudData.length > 0) {
          const allCloudIds = existingCloudData.map(e => e.id);
          const { error: deleteAllError } = await supabase
            .from('entries')
            .delete()
            .in('id', allCloudIds);
          
          if (deleteAllError) {
            console.error('删除云端所有数据失败:', deleteAllError);
            throw new Error('清除云端数据失败');
          }
          console.log('本地没有数据，已清除云端所有数据');
        } else {
          console.log('本地和云端都没有数据');
        }
        return true;
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      console.error('同步到云端失败:', errorMsg, error);
      // 抛出错误以便UI层捕获并显示详细错误信息
      throw new Error(errorMsg);
    } finally {
      isSyncingRef = false;
    }
  },

  /**
   * 从云端同步
   */
  syncFromCloud: async () => {
    const { user, entries } = get();
    
    if (!user) {
      console.error('用户未登录');
      return false;
    }
    
    // 检查是否正在同步，防止竞态条件
    if (isSyncingRef) {
      console.warn('同步操作正在进行中，请稍后再试');
      return false;
    }
    
    isSyncingRef = true;
    
    try {
      // 从 Supabase session 获取当前用户ID，确保使用正确的用户身份
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError);
        throw new Error('认证状态验证失败，请重新登录');
      }
      
      if (!session || !session.user) {
        console.error('当前没有有效的用户会话');
        throw new Error('用户未正确认证，请重新登录');
      }
      
      // 验证 session 用户ID与 store 中的 user.id 是否匹配
      if (session.user.id !== user.id) {
        console.error('用户 ID 不匹配:', {
          sessionUserId: session.user.id,
          storeUserId: user.id
        });
        throw new Error('用户身份验证失败，请重新登录');
      }
      
      // 使用 session 的用户ID查询数据，确保数据隔离
      const currentUserId = session.user.id;
      console.log('从云端同步数据，用户ID:', currentUserId);
      
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false });
        
      if (error) {
        const errorMsg = getErrorMessage(error);
        console.error('从云端同步失败:', errorMsg, error);
        throw new Error(errorMsg);
      }
      
      if (data && data.length > 0) {
        // 获取当前本地数据
        const currentLocalEntries = [...entries];
        
        // 转换云端数据格式以匹配本地格式（统一处理字段名大小写和时间戳格式）
        // 同时过滤掉 user_id 不匹配的数据（双重保险，防止数据泄露）
        const transformedCloudData = data
          .filter(cloudEntry => {
            // 确保云端数据的 user_id 与当前用户ID匹配
            const entryUserId = cloudEntry.user_id || cloudEntry.userId;
            if (entryUserId !== currentUserId) {
              console.warn(`过滤掉不属于当前用户的数据，entry ID: ${cloudEntry.id}, user_id: ${entryUserId}`);
              return false;
            }
            return true;
          })
          .map(cloudEntry => ({
            ...cloudEntry,
            moodLevel: cloudEntry.moodlevel || cloudEntry.moodLevel || 1, // 兼容两种格式，确保有默认值
            resolvedAt: cloudEntry.resolvedat ? ensureMilliseconds(cloudEntry.resolvedat) : cloudEntry.resolvedAt, // 确保时间戳为毫秒
            timestamp: ensureMilliseconds(cloudEntry.timestamp), // 确保时间戳为毫秒
          }));
        
        // 合并数据：使用时间戳策略解决冲突（最后写入获胜）
        // 创建本地数据的ID映射
        const localEntriesMap = new Map(currentLocalEntries.map(entry => [entry.id, entry]));
        const mergedEntriesMap = new Map<string, MoodEntry>();
        
        // 先添加所有本地数据
        currentLocalEntries.forEach(entry => {
          mergedEntriesMap.set(entry.id, entry);
        });
        
        // 遍历云端数据，添加或更新条目
        for (const cloudEntry of transformedCloudData) {
          const localEntry = localEntriesMap.get(cloudEntry.id);
          
          if (!localEntry) {
            // 云端独有的条目，直接添加
            mergedEntriesMap.set(cloudEntry.id, cloudEntry);
          } else {
            // 条目在本地和云端都存在，使用更新时间更晚的版本
            // 比较时间戳，使用较大的（更晚的）
            const localTimestamp = localEntry.timestamp || 0;
            const cloudTimestamp = cloudEntry.timestamp || 0;
            
            // 只有当云端时间戳严格大于本地时间戳时才覆盖
            // 这样可以防止本地未同步的新数据被云端旧数据覆盖
            if (cloudTimestamp > localTimestamp) {
              // 云端版本更新，使用云端数据
              mergedEntriesMap.set(cloudEntry.id, cloudEntry);
            }
            // 否则保留本地版本（已经在mergedEntriesMap中）
          }
        }
        
        // 转换回数组并按时间戳排序（最新的在前）
        const uniqueMergedEntries = Array.from(mergedEntriesMap.values());
        uniqueMergedEntries.sort((a, b) => b.timestamp - a.timestamp);
        
        set({ entries: uniqueMergedEntries });
        
        // 同时更新本地缓存（使用用户特定的存储键，使用 session 的用户ID确保正确）
        const storageKey = getStorageKey(currentUserId);
        await AsyncStorage.setItem(storageKey, JSON.stringify(uniqueMergedEntries));
        
        // 重新计算天气
        get()._calculateWeather();
        
        console.log(`成功从云端同步数据，合并了${uniqueMergedEntries.length}条记录（云端${transformedCloudData.length}条，过滤后）`);
        return true;
      } else {
        console.log('云端没有可同步的数据');
        return true; // 没有数据也算成功
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      console.error('从云端同步失败:', errorMsg, error);
      // 抛出错误以便UI层捕获并显示详细错误信息
      throw new Error(errorMsg);
    } finally {
      isSyncingRef = false;
    }
  },

  /**
   * 找回回忆（从云端恢复）
   */
  recoverFromCloud: async () => {
    const { user, entries } = get();
    
    // 检查是否正在同步，防止竞态条件
    if (isSyncingRef) {
      console.warn('同步操作正在进行中，请稍后再试');
      return false;
    }
    
    isSyncingRef = true;
    
    try {
      if (!user) {
        console.log('用户未登录，无法使用找回回忆功能');
        return false;
      }

      // 从 Supabase session 获取当前用户ID，确保使用正确的用户身份
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('获取会话失败:', sessionError);
        throw new Error('认证状态验证失败，请重新登录');
      }
      
      if (!session || !session.user) {
        console.error('当前没有有效的用户会话');
        throw new Error('用户未正确认证，请重新登录');
      }
      
      // 验证 session 用户ID与 store 中的 user.id 是否匹配
      if (session.user.id !== user.id) {
        console.error('用户 ID 不匹配:', {
          sessionUserId: session.user.id,
          storeUserId: user.id
        });
        throw new Error('用户身份验证失败，请重新登录');
      }
      
      // 使用 session 的用户ID查询数据，确保数据隔离
      const currentUserId = session.user.id;
      console.log('找回回忆，用户ID:', currentUserId);

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', currentUserId)
        .order('timestamp', { ascending: false });
        
      if (error) {
        const errorMsg = getErrorMessage(error);
        console.error('找回回忆失败:', errorMsg, error);
        throw new Error(errorMsg);
      }
      
      if (data && data.length > 0) {
        // 获取当前本地数据
        const currentLocalEntries = [...entries];
        
        // 转换云端数据格式以匹配本地格式（统一处理字段名大小写和时间戳格式）
        // 同时过滤掉 user_id 不匹配的数据（双重保险，防止数据泄露）
        const transformedCloudData = data
          .filter(cloudEntry => {
            // 确保云端数据的 user_id 与当前用户ID匹配
            const entryUserId = cloudEntry.user_id || cloudEntry.userId;
            if (entryUserId !== currentUserId) {
              console.warn(`过滤掉不属于当前用户的数据，entry ID: ${cloudEntry.id}, user_id: ${entryUserId}`);
              return false;
            }
            return true;
          })
          .map(cloudEntry => ({
            ...cloudEntry,
            moodLevel: cloudEntry.moodlevel || cloudEntry.moodLevel, // 兼容两种格式
            resolvedAt: cloudEntry.resolvedat ? ensureMilliseconds(cloudEntry.resolvedat) : cloudEntry.resolvedAt, // 确保时间戳为毫秒
            timestamp: ensureMilliseconds(cloudEntry.timestamp), // 确保时间戳为毫秒
          }));
        
        // 合并数据：使用时间戳策略解决冲突（最后写入获胜）
        // 创建本地数据的ID映射
        const localEntriesMap = new Map(currentLocalEntries.map(entry => [entry.id, entry]));
        const mergedEntriesMap = new Map<string, MoodEntry>();
        
        // 先添加所有本地数据
        currentLocalEntries.forEach(entry => {
          mergedEntriesMap.set(entry.id, entry);
        });
        
        // 遍历云端数据，添加或更新条目
        for (const cloudEntry of transformedCloudData) {
          const localEntry = localEntriesMap.get(cloudEntry.id);
          
          if (!localEntry) {
            // 云端独有的条目，直接添加
            mergedEntriesMap.set(cloudEntry.id, cloudEntry);
          } else {
            // 条目在本地和云端都存在，使用更新时间更晚的版本
            // 比较时间戳，使用较大的（更晚的）
            const localTimestamp = localEntry.timestamp || 0;
            const cloudTimestamp = cloudEntry.timestamp || 0;
            
            // 只有当云端时间戳严格大于本地时间戳时才覆盖
            // 这样可以防止本地未同步的新数据被云端旧数据覆盖
            if (cloudTimestamp > localTimestamp) {
              // 云端版本更新，使用云端数据
              mergedEntriesMap.set(cloudEntry.id, cloudEntry);
            }
            // 否则保留本地版本（已经在mergedEntriesMap中）
          }
        }
        
        // 转换回数组并按时间戳排序（最新的在前）
        const uniqueMergedEntries = Array.from(mergedEntriesMap.values());
        uniqueMergedEntries.sort((a, b) => b.timestamp - a.timestamp);
        
        set({ entries: uniqueMergedEntries });
        
        // 同时更新本地缓存（使用用户特定的存储键，使用 session 的用户ID确保正确）
        const storageKey = getStorageKey(currentUserId);
        await AsyncStorage.setItem(storageKey, JSON.stringify(uniqueMergedEntries));
        
        // 重新计算天气
        get()._calculateWeather();
        
        console.log(`找回回忆成功：合并了${uniqueMergedEntries.length}条记录（云端${transformedCloudData.length}条，过滤后）`);
        return true;
      } else {
        console.log('云端没有可恢复的数据');
        return true; // 没有数据也算成功
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      console.error('找回回忆失败:', errorMsg, error);
      // 抛出错误以便UI层捕获并显示详细错误信息
      throw new Error(errorMsg);
    } finally {
      isSyncingRef = false;
    }
  },

  /**
   * 生成情绪预测
   */
  generateForecast: async (days: number = 7) => {
    try {
      const { entries } = get();
      
      if (entries.length < 3) {
        console.log('数据不足，无法生成预测');
        set({ emotionForecast: null });
        return;
      }

      const forecast = await predictEmotionTrend(entries, days);
      set({ 
        emotionForecast: {
          ...forecast,
          lastUpdated: Date.now(),
        }
      });
    } catch (error) {
      console.error('生成情绪预测失败:', error);
      set({ emotionForecast: null });
    }
  },

  /**
   * 生成情绪播客
   */
  generatePodcast: async (period: 'week' | 'month' = 'week') => {
    try {
      const { entries } = get();
      
      const content = await generateEmotionPodcast(entries, period);
      
      if (content) {
        set({ 
          emotionPodcast: {
            content,
            period,
            generatedAt: Date.now(),
          }
        });
      }
    } catch (error) {
      console.error('生成情绪播客失败:', error);
      set({ emotionPodcast: null });
    }
  },

  /**
   * 清除情绪预测
   */
  clearForecast: () => {
    set({ emotionForecast: null });
  },

  /**
   * 清除情绪播客
   */
  clearPodcast: () => {
    set({ emotionPodcast: null });
  },
}));

/**
 * 初始化 Store
 * 在应用启动时调用，加载初始数据并设置监听器
 * 添加完善的错误处理，防止初始化失败导致应用崩溃
 */
export const initializeStore = () => {
  try {
    const store = useAppStore.getState();
    
    // 初始化数据库（异步执行，不阻塞应用启动）
    initializeDatabase().catch((error) => {
      console.error('数据库初始化失败:', error);
      // 不抛出错误，允许应用继续运行
    });
    
    // 加载初始数据（_loadUser 内部会调用 _loadEntries，避免重复调用）
    // 添加错误处理，防止加载失败导致应用崩溃
    try {
      store._loadUser();
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 即使加载失败，也继续初始化，应用可以以默认状态运行
    }
    
    // 如果 Supabase 未配置，不设置认证监听器
    if (!isSupabaseConfigured()) {
      console.log('Supabase 未配置，跳过认证监听器设置');
      // 返回一个空的清理函数
      return () => {};
    }
    
    // 监听认证状态变化
    // 添加错误处理，防止监听器设置失败导致应用崩溃
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    try {
      const listenerResult = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (session?.user) {
              // 检查是否是用户切换（从账号1切换到账号2）
              const currentUser = useAppStore.getState().user;
              const isUserSwitching = currentUser && currentUser.id !== session.user.id;
              
              if (isUserSwitching) {
                console.log('检测到用户切换，清除旧账号数据');
                // 先清除 store 中的 entries，避免旧账号数据残留
                useAppStore.getState()._setEntries([]);
              }
              
              // 用户已登录，加载用户信息和数据
              // 添加错误处理，防止数据库查询失败导致崩溃
              let profile = null;
              try {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (error) {
                  console.warn('获取用户资料失败:', error.message);
                } else {
                  profile = data;
                }
              } catch (error) {
                console.error('查询用户资料时发生错误:', error);
                // 继续使用默认值
              }
              
              const userData: User = {
                id: session.user.id,
                name: profile?.name || session.user.user_metadata?.name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || '情绪旅者',
                email: session.user.email || '',
                avatar: profile?.avatar || session.user.user_metadata?.avatar || 'https://picsum.photos/100/100',
              };
              
              // 验证用户ID是否匹配（双重保险）
              if (userData.id !== session.user.id) {
                console.error('用户ID不匹配，跳过加载数据');
                return;
              }
              
              useAppStore.getState()._setUser(userData);
              
              // 加载本地数据（使用新用户的存储键）
              try {
                useAppStore.getState()._loadEntries();
              } catch (error) {
                console.error('加载本地数据失败:', error);
              }
              
              // 不自动同步云端数据，用户需要主动点击"找回回忆"才会同步
              // 这样可以确保本地数据不会被覆盖
            } else {
              // 用户未登录，清除用户状态，但保留本地数据
              useAppStore.getState()._setUser(null);
              try {
                useAppStore.getState()._loadEntries();
              } catch (error) {
                console.error('加载本地数据失败:', error);
              }
            }
          } catch (error) {
            // 捕获认证状态变化回调中的所有错误，防止应用崩溃
            console.error('处理认证状态变化时发生错误:', error);
          }
        }
      );
      
      authListener = listenerResult.data;
    } catch (error) {
      console.error('设置认证监听器失败:', error);
      // 返回一个空的清理函数
      return () => {};
    }
    
    // 返回清理函数
    return () => {
      try {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      } catch (error) {
        console.error('取消订阅认证监听器失败:', error);
      }
    };
  } catch (error) {
    // 捕获所有初始化错误，防止应用崩溃
    console.error('初始化 Store 时发生严重错误:', error);
    // 返回一个空的清理函数，允许应用继续运行
    return () => {};
  }
};

