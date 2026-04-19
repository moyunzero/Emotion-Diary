/**
 * Zustand 根 store：组合 entries / user / weather / AI 等 slice 与同步逻辑。
 * 对外仍通过单一 `useAppStore` 暴露，便于组件订阅；持久化与云端同步在模块内协同。
 */

import "react-native-url-polyfill/auto";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { MoodEntry, User } from "../types";
import { getDefaultAvatar } from "../utils/avatarPresets";
import { ensureMilliseconds } from "@/shared/formatting";
import { isAuthError, isNetworkError } from "../utils/errorHandler";

// 导入模块
import { createAIModule } from "./modules/ai";
import { createAudioSlice } from "./modules/audio";
import {
  clearEntriesSaveDebounce,
  createEntriesSlice,
} from "./modules/entries";
import { getStorageKey, saveToStorage } from "./modules/storage";
import { AppStore } from "./modules/types";
import { createUserSlice } from "./modules/user";
import { createWeatherModule } from "./modules/weather";

// 同步操作互斥锁，防止竞态条件
let isSyncingRef = false;

// 待处理的同步请求标志
let pendingSyncRef = false;

// 同步请求防抖定时器
let syncDebounceTimerRef: ReturnType<typeof setTimeout> | null = null;

/**
 * 清理所有定时器（在应用关闭时调用）
 */
export const cleanupStoreTimers = (): void => {
  clearEntriesSaveDebounce();
  if (syncDebounceTimerRef) {
    clearTimeout(syncDebounceTimerRef);
    syncDebounceTimerRef = null;
  }
};

/**
 * 处理待处理的同步请求（带防抖）
 * 当同步操作完成后，如果有待处理的同步请求，则在短暂延迟后执行同步
 * 这样可以合并快速连续的同步请求
 */
const processPendingSync = async (): Promise<void> => {
  if (pendingSyncRef && !isSyncingRef) {
    // 清除现有的防抖定时器
    if (syncDebounceTimerRef) {
      clearTimeout(syncDebounceTimerRef);
    }

    // 设置新的防抖定时器（300ms）
    syncDebounceTimerRef = setTimeout(async () => {
      if (pendingSyncRef && !isSyncingRef) {
        pendingSyncRef = false;
        if (__DEV__) console.log("处理待处理的同步请求");
        await useAppStore.getState().syncToCloud();
      }
      syncDebounceTimerRef = null;
    }, 300);
  }
};

/**
 * 获取用户友好的错误消息
 */
const getErrorMessage = (error: unknown): string => {
  if (!error) return "操作失败，请稍后重试";

  const errorMessage = error instanceof Error ? error.message : String(error);

  // 使用统一的错误判断函数
  if (isNetworkError(error)) {
    return "网络连接失败，请检查网络设置";
  }

  if (isAuthError(error)) {
    if (errorMessage.includes("Invalid login credentials")) {
      return "邮箱或密码错误，请重新输入";
    }
    return "认证失败，请重新登录";
  }

  if (errorMessage.includes("User already registered")) {
    return "该邮箱已被注册";
  }

  if (errorMessage.includes("Email rate limit")) {
    return "请求过于频繁，请稍后再试";
  }

  // 数据库相关错误
  if (
    errorMessage.includes("relation") &&
    errorMessage.includes("does not exist")
  ) {
    return "数据库表不存在，请联系管理员";
  }

  // 主键冲突错误
  if (
    errorMessage.includes("23505") ||
    errorMessage.includes("duplicate key") ||
    errorMessage.includes("unique constraint")
  ) {
    return "记录已存在，将尝试更新";
  }

  // RLS 策略错误
  if (
    errorMessage.includes("42501") ||
    errorMessage.includes("row-level security") ||
    errorMessage.includes("violates row-level security policy")
  ) {
    return "数据库权限配置错误，请联系管理员检查行级安全策略";
  }

  if (
    errorMessage.includes("permission denied") ||
    errorMessage.includes("PGRST")
  ) {
    return "权限不足，请检查账号状态";
  }

  // 超时错误
  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return "请求超时，请检查网络连接";
  }

  // 默认错误消息
  return errorMessage.length > 50 ? "操作失败，请稍后重试" : errorMessage;
};

/**
 * 初始化数据库表结构
 */
const initializeDatabase = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    // Supabase 未配置，跳过数据库初始化
    return;
  }

  try {
    const { error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (checkError) {
      if (
        checkError.message &&
        checkError.message.includes('relation "public.profiles" does not exist')
      ) {
        if (__DEV__) console.log("Profiles table does not exist. Please execute the SQL script in Supabase SQL Editor to create it.");
      } else {
        console.warn(
          "Database initialization check failed:",
          checkError.message,
        );
      }
    }
  } catch (error) {
    console.error("Database initialization error:", error);
  }
};

/**
 * 创建 Zustand Store（Slices Pattern：create<AppStore>()((...a) => ({ ...slice(...a), ... }))）
 */
export const useAppStore = create<AppStore>()((...args) => {
  const set = args[0];
  const get = args[1];
  const store = args[2];
  return {
    ...createEntriesSlice(set, get, store),
    ...createWeatherModule(set, get),
    ...createAIModule(set, get),
    ...createAudioSlice(set, get, store),

    ...createUserSlice(set, get, store),

    syncStatus: "idle" as "idle" | "syncing" | "pending" | "error",

    /**
     * 同步到云端
     */
    syncToCloud: async () => {
      const { user, entries } = get();

      if (!user) {
        console.error("用户未登录");
        set({ syncStatus: "error" });
        return false;
      }

      if (isSyncingRef) {
        if (__DEV__) console.log("同步操作正在进行中，标记为待处理");
        pendingSyncRef = true;
        set({ syncStatus: "pending" });
        return false;
      }

      isSyncingRef = true;
      set({ syncStatus: "syncing" });

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error("认证状态验证失败，请重新登录");
        }

        if (session.user.id !== user.id) {
          throw new Error("用户身份验证失败，请重新登录");
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
            content: entry.content || "",
            deadline: entry.deadline || "later",
            people: peopleArray,
            triggers: triggersArray,
            status: entry.status || "active",
            resolvedat: entry.resolvedAt || null,
            burnedat: entry.burnedAt || null,
            user_id: currentUserId,
          };
        });

        // 获取云端数据
        const { data: existingCloudData, error: fetchError } = await supabase
          .from("entries")
          .select("id, user_id")
          .eq("user_id", currentUserId);

        if (fetchError) {
          console.warn("获取云端数据失败:", fetchError);
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
            .from("entries")
            .delete()
            .in("id", idsToDelete)
            .eq("user_id", currentUserId);
        }

        // 同步数据
        if (entriesToSync.length > 0) {
          // 使用 upsert 操作，但需要确保 RLS 策略正确配置
          // 如果 upsert 失败，回退到分离的 insert/update 操作

          try {
            const { error: upsertError } = await supabase
              .from("entries")
              .upsert(entriesToSync, {
                onConflict: "id",
                ignoreDuplicates: false,
              });

            if (upsertError) {
              // 如果是 RLS 错误，尝试使用分离的操作
              if (upsertError.code === "42501") {
                if (__DEV__) console.log("upsert 遇到 RLS 问题，使用分离的 insert/update 操作");

                const existingIds = new Set(
                  existingCloudData ? existingCloudData.map((e) => e.id) : [],
                );

                const newEntries = entriesToSync.filter(
                  (e) => !existingIds.has(e.id),
                );
                const updateEntries = entriesToSync.filter((e) =>
                  existingIds.has(e.id),
                );

                // 插入新记录
                if (newEntries.length > 0) {
                  const { error: insertError } = await supabase
                    .from("entries")
                    .insert(newEntries);

                  if (insertError && insertError.code !== "23505") {
                    // 忽略主键冲突错误，其他错误抛出
                    throw insertError;
                  }
                }

                // 更新已存在的记录
                if (updateEntries.length > 0) {
                  for (const entry of updateEntries) {
                    const { error: updateError } = await supabase
                      .from("entries")
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
                      .eq("id", entry.id)
                      .eq("user_id", currentUserId);

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
            console.error("同步记录失败:", error);
            console.error("失败的记录数量:", entriesToSync.length);
            console.error("第一条记录示例:", entriesToSync[0]);

            // 如果是约束错误，提供更详细的信息
            if (error.code === "23514") {
              console.error("数据库约束检查失败 (23514)");
              console.error("错误详情:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
              });

              throw new Error("数据库约束检查失败。请查看控制台日志了解详情。");
            }

            throw error;
          }
        }

        if (__DEV__) console.log("成功同步到云端");

        // 同步 firstEntryDate 到云端
        await get()._syncFirstEntryDateToCloud();

        set({ syncStatus: "idle" });
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        console.error("同步到云端失败:", errorMsg);
        set({ syncStatus: "error" });
        throw new Error(errorMsg);
      } finally {
        isSyncingRef = false;
        // 处理待处理的同步请求
        setTimeout(() => processPendingSync(), 100);
      }
    },

    /**
     * 从云端同步
     */
    syncFromCloud: async () => {
      const { user, entries } = get();

      if (!user) {
        console.error("用户未登录");
        set({ syncStatus: "error" });
        return false;
      }

      if (isSyncingRef) {
        if (__DEV__) console.log("同步操作正在进行中，标记为待处理");
        pendingSyncRef = true;
        set({ syncStatus: "pending" });
        return false;
      }

      isSyncingRef = true;
      set({ syncStatus: "syncing" });

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error("认证状态验证失败，请重新登录");
        }

        if (session.user.id !== user.id) {
          throw new Error("用户身份验证失败，请重新登录");
        }

        const currentUserId = session.user.id;

        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .eq("user_id", currentUserId)
          .order("timestamp", { ascending: false });

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
                status: cloudEntry.status || "active",
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
            entries.map((entry) => [entry.id, entry]),
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

          if (__DEV__) console.log("成功从云端同步数据");

          // 从云端同步 firstEntryDate
          await get()._syncFirstEntryDateFromCloud();

          set({ syncStatus: "idle" });
          return true;
        }

        set({ syncStatus: "idle" });
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        console.error("从云端同步失败:", errorMsg);
        set({ syncStatus: "error" });
        throw new Error(errorMsg);
      } finally {
        isSyncingRef = false;
        // 处理待处理的同步请求
        setTimeout(() => processPendingSync(), 100);
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
 * 应用启动时初始化：触发本地库/用户会话恢复、可选地注册 Supabase 认证监听。
 * 副作用包括异步加载条目、合并游客 firstEntryDate、在登录态变化时刷新 profile 与条目隔离。
 */
export const initializeStore = (): (() => void) => {
  try {
    const store = useAppStore.getState();

    initializeDatabase().catch((error) => {
      console.error("数据库初始化失败:", error);
    });

    try {
      store._loadUser().then(() => {
        // 在用户数据加载完成后，初始化 firstEntryDate
        store.initializeFirstEntryDate().catch((error) => {
          console.error("初始化 firstEntryDate 失败:", error);
        });
      });
    } catch (error) {
      console.warn("加载用户数据失败:", error);
    }

    if (!isSupabaseConfigured()) {
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
                if (__DEV__) console.log("检测到用户切换，清除旧账号数据");
                useAppStore.getState()._setEntries([]);
              }

              let profile = null;
              try {
                const { data, error } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .single();

                if (!error) {
                  profile = data;
                }
              } catch (error) {
                console.error("查询用户资料时发生错误:", error);
              }

              const userData: User = {
                id: session.user.id,
                name:
                  profile?.name ||
                  session.user.user_metadata?.name ||
                  session.user.user_metadata?.display_name ||
                  session.user.email?.split("@")[0] ||
                  "情绪旅者",
                email: session.user.email || "",
                avatar:
                  profile?.avatar ||
                  session.user.user_metadata?.avatar ||
                  getDefaultAvatar(
                    profile?.name ||
                      session.user.user_metadata?.name ||
                      session.user.user_metadata?.display_name ||
                      session.user.email?.split("@")[0],
                  ),
              };

              if (userData.id !== session.user.id) {
                console.error("用户ID不匹配，跳过加载数据");
                return;
              }

              useAppStore.getState()._setUser(userData);

              try {
                useAppStore.getState()._loadEntries();
              } catch (error) {
                console.error("加载本地数据失败:", error);
              }
            } else {
              useAppStore.getState()._setUser(null);
              try {
                useAppStore.getState()._loadEntries();
              } catch (error) {
                console.error("加载本地数据失败:", error);
              }
            }
          } catch (error) {
            console.error("处理认证状态变化时发生错误:", error);
          }
        },
      );

      authListener = listenerResult.data;
    } catch (error) {
      console.error("设置认证监听器失败:", error);
      return () => {};
    }

    return () => {
      try {
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      } catch (error) {
        console.error("取消订阅认证监听器失败:", error);
      }
    };
  } catch (error) {
    console.error("初始化 Store 时发生严重错误:", error);
    return () => {};
  }
};
