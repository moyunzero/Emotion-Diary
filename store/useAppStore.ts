/**
 * Zustand 根 store：组合 entries / user / weather / AI 等 slice 与同步逻辑。
 * 对外仍通过单一 `useAppStore` 暴露，便于组件订阅；持久化与云端同步在模块内协同。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-url-polyfill/auto";
import { Alert } from "react-native";
import { create } from "zustand";
import {
  isSupabaseConfigured,
  registerSecureStorePersistFailureHandler,
  supabase,
} from "../lib/supabase";
import { User } from "../types";
import { getDefaultAvatar } from "../utils/avatarPresets";
import { i18n } from "../i18n";
import { logger } from "../utils/logger";

// 导入模块
import {
  resolvePlayableRemoteUrl,
} from "../services/audioSync";
import { rescheduleEmotionRemindersFromStorage } from "../services/emotionReminders";
import {
  initAudioCoordinator,
  setAudioRemoteResolver,
} from "../shared/audio/coordinator";
import { initRecordingCoordinator } from "../shared/audio/recordingCoordinator";
import { createAIModule } from "./modules/ai";
import { createAudioSlice } from "./modules/audio";
import {
    clearEntriesSaveDebounce,
    createEntriesSlice,
} from "./modules/entries";
import { AppState } from "./modules/types";
import { createUserSlice, hydrateEntriesAfterGuestMigration } from "./modules/user";
import { createLocaleModule } from "./modules/locale";
import { createWeatherModule } from "./modules/weather";
import {
  clearPendingSyncDebounce,
  scheduleProcessPendingSync,
} from "./sync/pendingSync";
import { runPullFromCloud } from "./sync/pullFromCloud";
import { runPushToCloud } from "./sync/pushToCloud";

/** 全局音频协调器与 Zustand 的 one-shot 接线（避免 coordinator ↔ store 循环依赖） */
let audioCoordinatorInitialized = false;
let recordingCoordinatorInitialized = false;
/** SecureStore setItem 最终失败 → Alert + signOut（D-16/D-17；lib 不 import store） */
let secureStorePersistFailureHandlerRegistered = false;

/**
 * 清理所有定时器（在应用关闭时调用）
 */
export const cleanupStoreTimers = (): void => {
  clearEntriesSaveDebounce();
  clearPendingSyncDebounce();
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
 * 创建 Zustand Store（Slices Pattern：create<AppState>()((...a) => ({ ...slice(...a), ... }))）
 */
export const useAppStore = create<AppState>()((...args) => {
  const set = args[0];
  const get = args[1];
  const store = args[2];

  if (!audioCoordinatorInitialized) {
    audioCoordinatorInitialized = true;
    initAudioCoordinator((patch) => {
      set(patch as Partial<AppState>);
    });
    setAudioRemoteResolver(resolvePlayableRemoteUrl);
  }

  if (!recordingCoordinatorInitialized) {
    recordingCoordinatorInitialized = true;
    initRecordingCoordinator(
      (patch) => {
        set(patch as Partial<AppState>);
      },
      () => get().recordingState,
    );
  }

  if (!secureStorePersistFailureHandlerRegistered) {
    secureStorePersistFailureHandlerRegistered = true;
    registerSecureStorePersistFailureHandler(() => {
      Alert.alert(
        i18n.t("sessionPersistFailed.title", { ns: "auth" }),
        i18n.t("sessionPersistFailed.message", { ns: "auth" }),
      );
      void (async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          logger.warn("store", "signOut after SecureStore persist failure", error);
        }
        set({ user: null });
        try {
          await AsyncStorage.removeItem("user_session");
        } catch (error) {
          logger.warn("store", "clear user_session after SecureStore persist failure", error);
        }
      })();
    });
  }

  return {
    ...createEntriesSlice(set, get, store),
    ...createWeatherModule(set, get),
    ...createLocaleModule(set, get),
    ...createAIModule(set, get),
    ...createAudioSlice(set, get, store),

    ...createUserSlice(set, get, store),

    syncStatus: "idle" as "idle" | "syncing" | "pending" | "error",
    syncProgress: "",
    lastSyncTime: null as number | null,

    /**
     * 同步到云端
     */
    syncToCloud: async () =>
      runPushToCloud(get, set, () =>
        scheduleProcessPendingSync(() => get().syncToCloud()),
      ),

    /**
     * 从云端同步
     */
    syncFromCloud: async () =>
      runPullFromCloud(get, set, () =>
        scheduleProcessPendingSync(() => get().syncToCloud()),
      ),

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
        rescheduleEmotionRemindersFromStorage().catch((error) => {
          console.warn("恢复情绪提醒调度失败:", error);
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

              // 保留现有的 firstEntryDate
              if (currentUser?.firstEntryDate) {
                userData.firstEntryDate = currentUser.firstEntryDate;
              }

              useAppStore.getState()._setUser(userData);

              try {
                await hydrateEntriesAfterGuestMigration(
                  () => useAppStore.getState(),
                  (partial) => useAppStore.setState(partial),
                  session.user.id,
                );
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
