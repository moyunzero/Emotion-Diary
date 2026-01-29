/**
 * Zustand Store - 重构版本
 * 使用模块化架构，提高可维护性和可测试性
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { MoodEntry, User } from '../types';
import { ensureMilliseconds } from '../utils/dateUtils';
import { isAuthError, isNetworkError } from '../utils/errorHandler';

// 导入模块
import { createAIModule } from './modules/ai';
import { createEntriesModule } from './modules/entries';
import {
  checkGuestData,
  getStorageKey,
  loadFromStorage,
  migrateFromLegacyStorage,
  migrateGuestDataToUser,
  migrateUserDataToGuest,
  saveToStorage,
} from './modules/storage';
import { AppStore } from './modules/types';
import { createWeatherModule } from './modules/weather';

// 同步操作互斥锁，防止竞态条件
let isSyncingRef = false;

// AsyncStorage 写入防抖定时器
let saveEntriesTimeoutRef: ReturnType<typeof setTimeout> | null = null;

/**
 * 清理所有定时器（在应用关闭时调用）
 */
export const cleanupStoreTimers = (): void => {
  if (saveEntriesTimeoutRef) {
    clearTimeout(saveEntriesTimeoutRef);
    saveEntriesTimeoutRef = null;
  }
};

/**
 * 获取用户友好的错误消息
 */
const getErrorMessage = (error: unknown): string => {
  if (!error) return '操作失败，请稍后重试';

  const errorMessage = error instanceof Error ? error.message : String(error);

  // 使用统一的错误判断函数
  if (isNetworkError(error)) {
    return '网络连接失败，请检查网络设置';
  }

  if (isAuthError(error)) {
    if (errorMessage.includes('Invalid login credentials')) {
      return '邮箱或密码错误，请重新输入';
    }
    return '认证失败，请重新登录';
  }

  if (errorMessage.includes('User already registered')) {
    return '该邮箱已被注册';
  }

  if (errorMessage.includes('Email rate limit')) {
    return '请求过于频繁，请稍后再试';
  }

  // 数据库相关错误
  if (
    errorMessage.includes('relation') &&
    errorMessage.includes('does not exist')
  ) {
    return '数据库表不存在，请联系管理员';
  }

  // 主键冲突错误
  if (
    errorMessage.includes('23505') ||
    errorMessage.includes('duplicate key') ||
    errorMessage.includes('unique constraint')
  ) {
    return '记录已存在，将尝试更新';
  }

  // RLS 策略错误
  if (
    errorMessage.includes('42501') ||
    errorMessage.includes('row-level security') ||
    errorMessage.includes('violates row-level security policy')
  ) {
    return '数据库权限配置错误，请联系管理员检查行级安全策略';
  }

  if (
    errorMessage.includes('permission denied') ||
    errorMessage.includes('PGRST')
  ) {
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
 */
const initializeDatabase = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过数据库初始化');
    return;
  }

  try {
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (checkError) {
      if (
        checkError.message &&
        checkError.message.includes('relation "public.profiles" does not exist')
      ) {
        console.log(
          'Profiles table does not exist. Please execute the SQL script in Supabase SQL Editor to create it.'
        );
      } else {
        console.warn(
          'Database initialization check failed:',
          checkError.message
        );
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

/**
 * 创建 Zustand Store
 */
export const useAppStore = create<AppStore>((set, get) => {
  // 创建各个模块
  const entriesModule = createEntriesModule(set as any, get as any);
  const weatherModule = createWeatherModule(set as any, get as any);
  const aiModule = createAIModule(set as any, get as any);

  return {
    // 合并所有模块的状态和方法
    ...entriesModule,
    ...weatherModule,
    ...aiModule,

    // 用户管理状态
    user: null,

    /**
     * 设置用户
     */
    _setUser: (user: User | null) => {
      set({ user });
    },

    /**
     * 初始化firstEntryDate
     * 如果user.firstEntryDate不存在但有记录，则从记录中计算并设置
     * 应在用户登录后或应用启动时调用
     */
    initializeFirstEntryDate: async () => {
      const { user, entries } = get();
      
      // 如果已有firstEntryDate，检查是否需要与游客数据合并
      if (user?.firstEntryDate) {
        // 检查游客存储中是否有更早的 firstEntryDate
        try {
          const guestDate = await AsyncStorage.getItem('guest_first_entry_date');
          if (guestDate) {
            const guestTimestamp = parseInt(guestDate, 10);
            if (guestTimestamp < user.firstEntryDate) {
              // 游客数据更早，更新用户的 firstEntryDate
              const updatedUser = { ...user, firstEntryDate: guestTimestamp };
              set({ user: updatedUser });
              await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
              
              if (user.email) {
                await get()._syncFirstEntryDateToCloud();
              }
              
              console.log(`合并游客 firstEntryDate: ${guestTimestamp} (早于用户数据)`);
            }
            // 清除游客的 firstEntryDate（已合并到用户数据）
            await AsyncStorage.removeItem('guest_first_entry_date');
          }
        } catch (error) {
          console.error('合并游客 firstEntryDate 失败:', error);
        }
        return;
      }
      
      // 如果没有记录，无需初始化
      if (entries.length === 0) return;
      
      // 从记录中找到最早的时间戳
      const oldestTimestamp = Math.min(...entries.map(e => e.timestamp));
      
      // 检查游客存储中是否有 firstEntryDate
      let finalTimestamp = oldestTimestamp;
      try {
        const guestDate = await AsyncStorage.getItem('guest_first_entry_date');
        if (guestDate) {
          const guestTimestamp = parseInt(guestDate, 10);
          // 选择更早的时间戳
          finalTimestamp = Math.min(oldestTimestamp, guestTimestamp);
          console.log(`合并游客 firstEntryDate: ${guestTimestamp}, 记录最早: ${oldestTimestamp}, 最终: ${finalTimestamp}`);
        }
      } catch (error) {
        console.error('读取游客 firstEntryDate 失败:', error);
      }
      
      // 更新user对象
      if (user) {
        const updatedUser = { ...user, firstEntryDate: finalTimestamp };
        set({ user: updatedUser });
        
        // 保存到本地存储
        await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
        
        // 如果已登录，同步到云端
        if (user.email) {
          await get()._syncFirstEntryDateToCloud();
        }
        
        // 清除游客的 firstEntryDate（已合并到用户数据）
        await AsyncStorage.removeItem('guest_first_entry_date');
      } else {
        // 游客用户，保存到本地存储
        await AsyncStorage.setItem('guest_first_entry_date', finalTimestamp.toString());
      }
    },

    /**
     * 更新firstEntryDate
     * 当创建新记录时，如果firstEntryDate不存在或新记录更早，则更新
     * @param timestamp 新记录的时间戳
     */
    updateFirstEntryDate: async (timestamp: number) => {
      const { user } = get();
      
      // 如果已有firstEntryDate且新记录不更早，无需更新
      if (user?.firstEntryDate && timestamp >= user.firstEntryDate) return;
      
      if (user) {
        // 已登录用户
        const updatedUser = { ...user, firstEntryDate: timestamp };
        set({ user: updatedUser });
        
        await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
        
        if (user.email) {
          await get()._syncFirstEntryDateToCloud();
        }
      } else {
        // 游客用户
        const existingDate = await AsyncStorage.getItem('guest_first_entry_date');
        if (!existingDate || timestamp < parseInt(existingDate)) {
          await AsyncStorage.setItem('guest_first_entry_date', timestamp.toString());
        }
      }
    },

    /**
     * 清除firstEntryDate
     * 当删除所有记录时调用
     */
    clearFirstEntryDate: async () => {
      const { user, entries } = get();
      
      // 只有在没有记录时才清除
      if (entries.length > 0) return;
      
      if (user) {
        const updatedUser = { ...user, firstEntryDate: undefined };
        set({ user: updatedUser });
        
        await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
        
        if (user.email) {
          await get()._syncFirstEntryDateToCloud();
        }
      } else {
        await AsyncStorage.removeItem('guest_first_entry_date');
      }
    },

    /**
     * 同步firstEntryDate到云端
     * 在syncToCloud时调用，确保云端数据一致
     */
    _syncFirstEntryDateToCloud: async () => {
      const { user } = get();
      if (!user?.email) return;
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            first_entry_date: user.firstEntryDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        
        if (error) {
          // 如果是字段不存在的错误，只记录警告，不影响应用使用
          if (error.code === 'PGRST204' || error.message?.includes('first_entry_date')) {
            console.warn('数据库中 first_entry_date 字段不存在，请执行数据库迁移。详见: docs/FIRST_ENTRY_DATE_MIGRATION.md');
            console.warn('应用将继续使用本地计算，不影响功能。');
          } else {
            console.error('同步firstEntryDate到云端失败:', error);
          }
        }
      } catch (error) {
        console.error('同步firstEntryDate到云端异常:', error);
      }
    },

    /**
     * 从云端同步firstEntryDate
     * 在syncFromCloud时调用，合并本地和云端的firstEntryDate
     */
    _syncFirstEntryDateFromCloud: async () => {
      const { user } = get();
      if (!user?.email) return;
      
      try {
        // 获取云端的firstEntryDate
        const { data, error } = await supabase
          .from('profiles')
          .select('first_entry_date')
          .eq('id', user.id)
          .single();
        
        if (error || !data) return;
        
        const cloudFirstEntryDate = data.first_entry_date;
        const localFirstEntryDate = user.firstEntryDate;
        
        // 选择更早的时间戳
        let finalFirstEntryDate: number | undefined;
        
        if (cloudFirstEntryDate && localFirstEntryDate) {
          finalFirstEntryDate = Math.min(cloudFirstEntryDate, localFirstEntryDate);
        } else {
          finalFirstEntryDate = cloudFirstEntryDate || localFirstEntryDate;
        }
        
        // 如果有变化，更新本地和云端
        if (finalFirstEntryDate !== localFirstEntryDate) {
          const updatedUser = { ...user, firstEntryDate: finalFirstEntryDate };
          set({ user: updatedUser });
          await AsyncStorage.setItem('user_session', JSON.stringify(updatedUser));
        }
        
        if (finalFirstEntryDate !== cloudFirstEntryDate) {
          await get()._syncFirstEntryDateToCloud();
        }
      } catch (error) {
        console.error('从云端同步firstEntryDate异常:', error);
      }
    },

    /**
     * 加载本地条目
     */
    _loadEntries: async () => {
      try {
        const { user } = get();
        const userId = user?.id || null;

        // 检查是否需要迁移旧版数据
        const migrationResult = await migrateFromLegacyStorage(userId);
        if (migrationResult.success && migrationResult.data) {
          set({ entries: migrationResult.data });
          get()._calculateWeather();
          return;
        }

        // 加载数据
        const storageKey = getStorageKey(userId);
        const entries = await loadFromStorage(storageKey);
        set({ entries });

        // 重新计算天气
        get()._calculateWeather();
      } catch (error) {
        console.error('Error loading entries:', error);
        set({ entries: [] });
      }
    },

    /**
     * 保存条目到本地（带防抖）
     */
    _saveEntries: () => {
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

    /**
     * 加载用户信息
     */
    _loadUser: async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          let userData: User = {
            id: session.user.id,
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.display_name ||
              session.user.email?.split('@')[0] ||
              '情绪旅者',
            email: session.user.email || '',
            avatar:
              session.user.user_metadata?.avatar ||
              'https://picsum.photos/100/100',
          };

          // 尝试获取 profile 信息
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (!profileError && profile) {
              userData = {
                ...userData,
                name: profile.name || userData.name,
                avatar: profile.avatar || userData.avatar,
              };
            } else if (profileError && profileError.code === 'PGRST116') {
              // 创建 profile
              const newProfile = {
                id: session.user.id,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar,
                updated_at: new Date().toISOString(),
              };

              await supabase.from('profiles').insert(newProfile);
            }
          } catch (err) {
            console.error('Profile operation exception:', err);
          }

          set({ user: userData });
          get()._loadEntries();
        } else {
          set({ user: null });
          await AsyncStorage.removeItem('user_session');
          get()._loadEntries();
        }
      } catch (error) {
        console.error('Error loading user:', error);
        set({ user: null });
        get()._loadEntries();
      }
    },

    /**
     * 用户注册
     */
    register: async (email: string, password: string, name: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              display_name: name,
            },
          },
        });

        if (error) {
          console.error('Registration error:', error);
          if (error.message.includes('User already registered')) {
            throw new Error('User already registered');
          }
          if (error.message.includes('Password should be at least')) {
            throw new Error('密码强度不足，请尝试设置更复杂的密码');
          }
          if (error.message.includes('Invalid email')) {
            throw new Error('邮箱格式不正确，请确认后重试');
          }
          return false;
        }

        if (data.user) {
          return await get().login(email, password);
        }

        return false;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },

    /**
     * 用户登录
     */
    login: async (email: string, password: string) => {
      try {
        if (!email || !password) {
          console.error('邮箱和密码不能为空');
          return false;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('登录失败:', error.message);
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('邮箱或密码不正确');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('邮箱尚未完成验证，请先前往邮箱完成验证');
          }
          if (
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network')
          ) {
            throw new Error('网络连接异常，请稍后重试');
          }
          return false;
        }

        if (data.user) {
          let userData: User = {
            id: data.user.id,
            name:
              data.user.user_metadata?.name ||
              data.user.user_metadata?.display_name ||
              data.user.email?.split('@')[0] ||
              '情绪旅人',
            email: data.user.email || '',
            avatar:
              data.user.user_metadata?.avatar ||
              'https://picsum.photos/100/100',
          };

          // 尝试获取 profile
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (!profileError && profile) {
              userData = {
                ...userData,
                name: profile.name || userData.name,
                avatar: profile.avatar || userData.avatar,
              };
            } else if (profileError && profileError.code === 'PGRST116') {
              const newProfile = {
                id: data.user.id,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar,
                updated_at: new Date().toISOString(),
              };

              await supabase.from('profiles').insert(newProfile);
            }
          } catch (err) {
            console.error('Profile operation exception:', err);
          }

          // 检查用户切换
          const { user: currentUser } = get();
          const isUserSwitching = currentUser && currentUser.id !== userData.id;

          if (isUserSwitching) {
            console.log('检测到用户切换，清除旧账号数据');
            set({ entries: [] });
          }

          set({ user: userData });
          await AsyncStorage.setItem('user_session', JSON.stringify(userData));

          // 检查游客数据迁移
          const guestData = await checkGuestData();
          if (guestData.length > 0) {
            console.log(`发现 ${guestData.length} 条游客数据，正在迁移...`);
            const migrationResult = await migrateGuestDataToUser(userData.id);
            if (migrationResult.success && migrationResult.data) {
              set({ entries: migrationResult.data });
              get()._calculateWeather();
            }
          } else {
            await get()._loadEntries();
          }

          // 初始化 firstEntryDate（如果需要）
          await get().initializeFirstEntryDate();

          return true;
        }

        return false;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    /**
     * 用户登出
     */
    logout: async () => {
      try {
        const { user, entries } = get();

        if (!user) {
          set({ user: null });
          await AsyncStorage.removeItem('user_session');
          await get()._loadEntries();
          return;
        }

        // 保存当前数据
        if (entries.length > 0) {
          const userKey = getStorageKey(user.id);
          await saveToStorage(userKey, entries);
        }

        // 保存 firstEntryDate 到游客存储（重要：确保退出后陪伴天数不丢失）
        if (user.firstEntryDate) {
          await AsyncStorage.setItem('guest_first_entry_date', user.firstEntryDate.toString());
        }

        // 合并到游客存储
        const migrationResult = await migrateUserDataToGuest(user.id);

        // 登出
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Logout error:', error);
        }

        set({ user: null });
        await AsyncStorage.removeItem('user_session');

        // 更新数据
        if (migrationResult.success && migrationResult.data) {
          set({ entries: migrationResult.data });
          get()._calculateWeather();
        } else {
          await get()._loadEntries();
        }
      } catch (error) {
        console.error('Logout error:', error);
        set({ user: null });
        await AsyncStorage.removeItem('user_session');
        await get()._loadEntries();
      }
    },

    /**
     * 更新用户信息
     */
    updateUser: async (updates: Partial<User>) => {
      const { user } = get();
      if (!user) return;

      try {
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

      if (isSyncingRef) {
        console.warn('同步操作正在进行中');
        return false;
      }

      isSyncingRef = true;

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error('认证状态验证失败，请重新登录');
        }

        if (session.user.id !== user.id) {
          throw new Error('用户身份验证失败，请重新登录');
        }

        const currentUserId = session.user.id;

        // 准备同步数据
        const entriesToSync = entries.map((entry) => {
          const peopleArray = Array.isArray(entry.people) ? entry.people : [];
          const triggersArray = Array.isArray(entry.triggers)
            ? entry.triggers
            : [];

          return {
            id: entry.id,
            timestamp: entry.timestamp,
            moodlevel: entry.moodLevel || 1,
            content: entry.content || '',
            deadline: entry.deadline || 'later',
            people: peopleArray,
            triggers: triggersArray,
            status: entry.status || 'active',
            resolvedat: entry.resolvedAt || null,
            burnedat: entry.burnedAt || null,
            user_id: currentUserId,
          };
        });

        // 获取云端数据
        const { data: existingCloudData, error: fetchError } = await supabase
          .from('entries')
          .select('id, user_id')
          .eq('user_id', currentUserId);

        if (fetchError) {
          console.warn('获取云端数据失败:', fetchError);
        }

        // 删除云端多余数据
        const localIds = new Set(entriesToSync.map((e) => e.id));
        const idsToDelete: string[] = [];

        if (existingCloudData) {
          existingCloudData.forEach((cloudEntry) => {
            if (
              !localIds.has(cloudEntry.id) &&
              cloudEntry.user_id === currentUserId
            ) {
              idsToDelete.push(cloudEntry.id);
            }
          });
        }

        if (idsToDelete.length > 0) {
          await supabase
            .from('entries')
            .delete()
            .in('id', idsToDelete)
            .eq('user_id', currentUserId);
        }

        // 同步数据
        if (entriesToSync.length > 0) {
          // 使用 upsert 操作，但需要确保 RLS 策略正确配置
          // 如果 upsert 失败，回退到分离的 insert/update 操作
          
          try {
            const { error: upsertError } = await supabase
              .from('entries')
              .upsert(entriesToSync, {
                onConflict: 'id',
                ignoreDuplicates: false,
              });

            if (upsertError) {
              // 如果是 RLS 错误，尝试使用分离的操作
              if (upsertError.code === '42501') {
                console.log('upsert 遇到 RLS 问题，使用分离的 insert/update 操作');
                
                const existingIds = new Set(
                  existingCloudData ? existingCloudData.map((e) => e.id) : []
                );

                const newEntries = entriesToSync.filter((e) => !existingIds.has(e.id));
                const updateEntries = entriesToSync.filter((e) => existingIds.has(e.id));

                // 插入新记录
                if (newEntries.length > 0) {
                  const { error: insertError } = await supabase
                    .from('entries')
                    .insert(newEntries);

                  if (insertError && insertError.code !== '23505') {
                    // 忽略主键冲突错误，其他错误抛出
                    throw insertError;
                  }
                }

                // 更新已存在的记录
                if (updateEntries.length > 0) {
                  for (const entry of updateEntries) {
                    const { error: updateError } = await supabase
                      .from('entries')
                      .update({
                        timestamp: entry.timestamp,
                        moodlevel: entry.moodlevel,
                        content: entry.content,
                        deadline: entry.deadline,
                        people: entry.people,
                        triggers: entry.triggers,
                        status: entry.status,
                        resolvedat: entry.resolvedat,
                        burnedat: entry.burnedat,
                      })
                      .eq('id', entry.id)
                      .eq('user_id', currentUserId);
                    
                    if (updateError) {
                      console.warn(`更新记录 ${entry.id} 失败:`, updateError);
                    }
                  }
                }
              } else {
                // 其他错误，抛出
                throw upsertError;
              }
            }
          } catch (error: any) {
            console.error('同步记录失败:', error);
            console.error('失败的记录数量:', entriesToSync.length);
            console.error('第一条记录示例:', entriesToSync[0]);
            
            // 如果是约束错误，提供更详细的信息
            if (error.code === '23514') {
              console.error('数据库约束检查失败 (23514)');
              console.error('错误详情:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
              });
              
              throw new Error(
                '数据库约束检查失败。请查看控制台日志了解详情。'
              );
            }
            
            throw error;
          }
        }

        console.log('成功同步到云端');
        
        // 同步 firstEntryDate 到云端
        await get()._syncFirstEntryDateToCloud();
        
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        console.error('同步到云端失败:', errorMsg);
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

      if (isSyncingRef) {
        console.warn('同步操作正在进行中');
        return false;
      }

      isSyncingRef = true;

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error('认证状态验证失败，请重新登录');
        }

        if (session.user.id !== user.id) {
          throw new Error('用户身份验证失败，请重新登录');
        }

        const currentUserId = session.user.id;

        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', currentUserId)
          .order('timestamp', { ascending: false });

        if (error) {
          const errorMsg = getErrorMessage(error);
          throw new Error(errorMsg);
        }

        if (data && data.length > 0) {
          const transformedCloudData = data
            .filter((cloudEntry) => {
              const entryUserId = cloudEntry.user_id || cloudEntry.userId;
              return entryUserId === currentUserId;
            })
            .map((cloudEntry) => {
              return {
                ...cloudEntry,
                moodLevel: cloudEntry.moodlevel || cloudEntry.moodLevel || 1,
                status: cloudEntry.status || 'active',
                resolvedAt: cloudEntry.resolvedat
                  ? ensureMilliseconds(cloudEntry.resolvedat)
                  : cloudEntry.resolvedAt,
                burnedAt: cloudEntry.burnedat
                  ? ensureMilliseconds(cloudEntry.burnedat)
                  : cloudEntry.burnedAt,
                timestamp: ensureMilliseconds(cloudEntry.timestamp),
              };
            });

          // 合并数据
          const localEntriesMap = new Map(
            entries.map((entry) => [entry.id, entry])
          );
          const mergedEntriesMap = new Map<string, MoodEntry>();

          entries.forEach((entry) => {
            mergedEntriesMap.set(entry.id, entry);
          });

          for (const cloudEntry of transformedCloudData) {
            const localEntry = localEntriesMap.get(cloudEntry.id);

            if (!localEntry) {
              mergedEntriesMap.set(cloudEntry.id, cloudEntry);
            } else {
              const localTimestamp = localEntry.timestamp || 0;
              const cloudTimestamp = cloudEntry.timestamp || 0;

              if (cloudTimestamp > localTimestamp) {
                mergedEntriesMap.set(cloudEntry.id, cloudEntry);
              }
            }
          }

          const uniqueMergedEntries = Array.from(mergedEntriesMap.values());
          uniqueMergedEntries.sort((a, b) => b.timestamp - a.timestamp);

          set({ entries: uniqueMergedEntries });

          const storageKey = getStorageKey(currentUserId);
          await saveToStorage(storageKey, uniqueMergedEntries);

          get()._calculateWeather();

          console.log('成功从云端同步数据');
          
          // 从云端同步 firstEntryDate
          await get()._syncFirstEntryDateFromCloud();
          
          return true;
        }

        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        console.error('从云端同步失败:', errorMsg);
        throw new Error(errorMsg);
      } finally {
        isSyncingRef = false;
      }
    },

    /**
     * 找回回忆（从云端恢复）
     */
    recoverFromCloud: async () => {
      // 使用相同的逻辑
      return get().syncFromCloud();
    },
  };
});

/**
 * 初始化 Store
 */
export const initializeStore = (): (() => void) => {
  try {
    const store = useAppStore.getState();

    initializeDatabase().catch((error) => {
      console.error('数据库初始化失败:', error);
    });

    try {
      store._loadUser().then(() => {
        // 在用户数据加载完成后，初始化 firstEntryDate
        store.initializeFirstEntryDate().catch((error) => {
          console.error('初始化 firstEntryDate 失败:', error);
        });
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }

    if (!isSupabaseConfigured()) {
      console.log('Supabase 未配置，跳过认证监听器设置');
      return () => {};
    }

    let authListener: { subscription: { unsubscribe: () => void } } | null =
      null;

    try {
      const listenerResult = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (session?.user) {
              const currentUser = useAppStore.getState().user;
              const isUserSwitching =
                currentUser && currentUser.id !== session.user.id;

              if (isUserSwitching) {
                console.log('检测到用户切换，清除旧账号数据');
                useAppStore.getState()._setEntries([]);
              }

              let profile = null;
              try {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                if (!error) {
                  profile = data;
                }
              } catch (error) {
                console.error('查询用户资料时发生错误:', error);
              }

              const userData: User = {
                id: session.user.id,
                name:
                  profile?.name ||
                  session.user.user_metadata?.name ||
                  session.user.user_metadata?.display_name ||
                  session.user.email?.split('@')[0] ||
                  '情绪旅者',
                email: session.user.email || '',
                avatar:
                  profile?.avatar ||
                  session.user.user_metadata?.avatar ||
                  'https://picsum.photos/100/100',
              };

              if (userData.id !== session.user.id) {
                console.error('用户ID不匹配，跳过加载数据');
                return;
              }

              useAppStore.getState()._setUser(userData);

              try {
                useAppStore.getState()._loadEntries();
              } catch (error) {
                console.error('加载本地数据失败:', error);
              }
            } else {
              useAppStore.getState()._setUser(null);
              try {
                useAppStore.getState()._loadEntries();
              } catch (error) {
                console.error('加载本地数据失败:', error);
              }
            }
          } catch (error) {
            console.error('处理认证状态变化时发生错误:', error);
          }
        }
      );

      authListener = listenerResult.data;
    } catch (error) {
      console.error('设置认证监听器失败:', error);
      return () => {};
    }

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
    console.error('初始化 Store 时发生严重错误:', error);
    return () => {};
  }
};
