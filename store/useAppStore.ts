/**
 * Zustand 根 store：组合 entries / user / weather / AI 等 slice 与同步逻辑。
 * 对外仍通过单一 `useAppStore` 暴露，便于组件订阅；持久化与云端同步在模块内协同。
 */

import { ensureMilliseconds } from "@/shared/formatting";
import "react-native-url-polyfill/auto";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { User } from "../types";
import { getDefaultAvatar } from "../utils/avatarPresets";
import { i18n } from "../i18n";
import { isAuthError, isNetworkError } from "../utils/errorHandler";

// 导入模块
import { uploadPendingAudios } from "../services/audioSync";
import { rescheduleEmotionRemindersFromStorage } from "../services/emotionReminders";
import { fetchUserTombstoneEntryIds } from "../services/entryTombstones";
import { initAudioCoordinator } from "../shared/audio/coordinator";
import { initRecordingCoordinator } from "../shared/audio/recordingCoordinator";
import { applyAudioUploadResults } from "../shared/audio/sync";
import { mergeCloudPullEntries } from "../shared/sync/cloudMerge";
import {
  consumePendingSyncRequest,
  hasPendingSyncRequest,
  isSyncLockHeld,
  releaseSyncLock,
  tryBeginSync,
} from "../shared/sync/syncLock";
import { filterOutTombstonedEntries } from "../shared/sync/tombstone";
import { createAIModule } from "./modules/ai";
import { createAudioSlice } from "./modules/audio";
import {
    clearEntriesSaveDebounce,
    createEntriesSlice,
} from "./modules/entries";
import { getStorageKey, saveToStorage } from "./modules/storage";
import { AppState } from "./modules/types";
import { createUserSlice, hydrateEntriesAfterGuestMigration } from "./modules/user";
import { createLocaleModule } from "./modules/locale";
import { createWeatherModule } from "./modules/weather";

/** 全局音频协调器与 Zustand 的 one-shot 接线（避免 coordinator ↔ store 循环依赖） */
let audioCoordinatorInitialized = false;
let recordingCoordinatorInitialized = false;

// 待处理同步的防抖定时器（互斥见 shared/sync/syncLock.ts）

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
  if (hasPendingSyncRequest() && !isSyncLockHeld()) {
    // 清除现有的防抖定时器
    if (syncDebounceTimerRef) {
      clearTimeout(syncDebounceTimerRef);
    }

    // 设置新的防抖定时器（300ms）
    syncDebounceTimerRef = setTimeout(async () => {
      if (consumePendingSyncRequest() && !isSyncLockHeld()) {
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
  if (!error) {
    return i18n.t("generic.operationFailed", { ns: "system" });
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return i18n.t("errors.requestTimeout", { ns: "system" });
  }

  if (isNetworkError(error)) {
    return i18n.t("errors.networkConnectionFailed", { ns: "system" });
  }

  if (isAuthError(error)) {
    if (errorMessage.includes("Invalid login credentials")) {
      return i18n.t("errors.invalidLoginCredentials", { ns: "system" });
    }
    return i18n.t("errors.authFailedRelogin", { ns: "system" });
  }

  if (errorMessage.includes("User already registered")) {
    return i18n.t("errors.emailRegistered", { ns: "system" });
  }

  if (errorMessage.includes("Email rate limit")) {
    return i18n.t("errors.rateLimited", { ns: "system" });
  }

  if (
    errorMessage.includes("relation") &&
    errorMessage.includes("does not exist")
  ) {
    return i18n.t("errors.dbTableMissing", { ns: "system" });
  }

  if (
    errorMessage.includes("23505") ||
    errorMessage.includes("duplicate key") ||
    errorMessage.includes("unique constraint")
  ) {
    return i18n.t("errors.recordExistsWillUpdate", { ns: "system" });
  }

  if (
    errorMessage.includes("42501") ||
    errorMessage.includes("row-level security") ||
    errorMessage.includes("violates row-level security policy")
  ) {
    return i18n.t("errors.rlsPolicyError", { ns: "system" });
  }

  if (
    errorMessage.includes("permission denied") ||
    errorMessage.includes("PGRST")
  ) {
    return i18n.t("errors.permissionDenied", { ns: "system" });
  }

  return errorMessage.length > 50
    ? i18n.t("generic.operationFailed", { ns: "system" })
    : errorMessage;
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

  return {
    ...createEntriesSlice(set, get, store),
    ...createWeatherModule(set, get),
    ...createLocaleModule(set, get),
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

      const begin = tryBeginSync();
      if (!begin.proceed) {
        if (__DEV__) console.log("同步操作正在进行中，标记为待处理");
        set({ syncStatus: "pending" });
        return false;
      }

      set({ syncStatus: "syncing" });

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error(
            i18n.t("errors.sessionVerifyFailed", { ns: "system" }),
          );
        }

        if (session.user.id !== user.id) {
          throw new Error(
            i18n.t("errors.identityVerifyFailed", { ns: "system" }),
          );
        }

        const currentUserId = session.user.id;

        // B-3：仅根据 entry_tombstones 显式删云，禁止「云端有、本地无」差集删除（H3 完整版）。
        const {
          tombstoneIdsArr,
          tombstoneIdSet,
          tombstoneFetchError,
        } = await fetchUserTombstoneEntryIds(supabase, currentUserId);

        if (tombstoneFetchError) {
          console.warn("获取 entry_tombstones 失败:", tombstoneFetchError);
        }

        // 准备同步数据（墓碑命中的 id 不得再 upsert，否则会复活已 purge 的云端行）
        const entriesToSync = filterOutTombstonedEntries(
          entries.map((entry) => {
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
              deletedat:
                typeof entry.deletedAt === "number" && entry.deletedAt > 0
                  ? entry.deletedAt
                  : null,
              user_id: currentUserId,
              audios: entry.audios || [],
            };
          }),
          tombstoneIdSet,
        );

        // 获取云端数据（upsert 回退路径需要已知云端 id 集合）
        const { data: existingCloudData, error: fetchError } = await supabase
          .from("entries")
          .select("id, user_id")
          .eq("user_id", currentUserId);

        if (fetchError) {
          console.warn("获取云端数据失败:", fetchError);
        }

        if (tombstoneIdsArr.length > 0) {
          const { error: purgeError } = await supabase
            .from("entries")
            .delete()
            .in("id", tombstoneIdsArr)
            .eq("user_id", currentUserId);

          if (purgeError) {
            console.warn(
              "[syncToCloud] 按墓碑删除云端 entries 失败:",
              purgeError,
            );
          }
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
                        deletedat: entry.deletedat,
                        audios: entry.audios || [],
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
          } catch (error: unknown) {
            console.error("同步记录失败:", error);
            console.error("失败的记录数量:", entriesToSync.length);
            console.error("第一条记录示例:", entriesToSync[0]);

            const pgCode =
              error !== null &&
              typeof error === "object" &&
              "code" in error &&
              (error as { code?: string }).code === "23514";

            if (pgCode) {
              const e = error as {
                message?: string;
                details?: string;
                hint?: string;
              };
              console.error("数据库约束检查失败 (23514)");
              console.error("错误详情:", {
                message: e.message,
                details: e.details,
                hint: e.hint,
              });

              throw new Error(
                i18n.t("errors.dbConstraintFailed", { ns: "system" }),
              );
            }

            throw error;
          }
        }

        if (__DEV__) console.log("成功同步到云端");

        // 同步 firstEntryDate 到云端
        await get()._syncFirstEntryDateToCloud();

        // 同步音频文件到云端
        try {
          const allAudios = entries
            .flatMap((e) => e.audios || [])
            .filter(
              (a) =>
                a.syncStatus === "pending" || a.syncStatus === "failed",
            );

          if (allAudios.length > 0) {
            const uploadResult = await uploadPendingAudios(
              allAudios,
              currentUserId,
            );
            if (__DEV__) {
              console.log(
                `音频同步完成: 成功 ${uploadResult.success}, 失败 ${uploadResult.failed}`,
              );
            }

            if (
              uploadResult.results.size > 0 ||
              uploadResult.failedAudioIds.length > 0
            ) {
              const failedSet = new Set(uploadResult.failedAudioIds);
              const { updatedEntries, writeback } = applyAudioUploadResults(
                entries,
                uploadResult.results,
                failedSet,
              );

              set({ entries: updatedEntries });
              get()._saveEntries();

              for (const payload of writeback) {
                const { error: writebackError } = await supabase
                  .from("entries")
                  .update({ audios: payload.audios })
                  .eq("id", payload.id)
                  .eq("user_id", currentUserId);

                if (writebackError) {
                  console.warn(
                    `回写 entry ${payload.id} 的 audios 元数据失败:`,
                    writebackError,
                  );
                }
              }
            }

            if (uploadResult.failed > 0) {
              console.warn(
                `[syncToCloud] ${uploadResult.failed} 条语音上传失败，已标记 failed，可重试`,
              );
            }
          }
        } catch (audioError) {
          console.error("音频同步失败:", audioError);
        }

        set({ syncStatus: "idle" });
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        console.error("同步到云端失败:", errorMsg);
        set({ syncStatus: "error" });
        throw new Error(errorMsg);
      } finally {
        releaseSyncLock();
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

      const beginPull = tryBeginSync();
      if (!beginPull.proceed) {
        if (__DEV__) console.log("同步操作正在进行中，标记为待处理");
        set({ syncStatus: "pending" });
        return false;
      }

      set({ syncStatus: "syncing" });

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          throw new Error(
            i18n.t("errors.sessionVerifyFailed", { ns: "system" }),
          );
        }

        if (session.user.id !== user.id) {
          throw new Error(
            i18n.t("errors.identityVerifyFailed", { ns: "system" }),
          );
        }

        const currentUserId = session.user.id;

        const { tombstoneIdSet, tombstoneFetchError } =
          await fetchUserTombstoneEntryIds(supabase, currentUserId);

        if (tombstoneFetchError) {
          console.warn("获取 entry_tombstones 失败:", tombstoneFetchError);
        }

        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .eq("user_id", currentUserId)
          .order("timestamp", { ascending: false });

        if (error) {
          const errorMsg = getErrorMessage(error);
          throw new Error(errorMsg);
        }

        if (!data || data.length === 0) {
          const pruned = filterOutTombstonedEntries(entries, tombstoneIdSet);
          if (pruned.length !== entries.length) {
            set({ entries: pruned });
            const storageKey = getStorageKey(currentUserId);
            await saveToStorage(storageKey, pruned);
            get()._calculateWeather();
          }

          await get()._syncFirstEntryDateFromCloud();

          set({ syncStatus: "idle" });
          return true;
        }

        const transformedCloudData = data
          .filter((cloudEntry) => {
            const entryUserId = cloudEntry.user_id || cloudEntry.userId;
            return entryUserId === currentUserId;
          })
          .map((cloudEntry) => {
            const rawDeleted =
              cloudEntry.deletedat ?? cloudEntry.deletedAt ?? null;
            const deletedAtMs =
              rawDeleted != null && typeof rawDeleted === "number"
                ? ensureMilliseconds(rawDeleted)
                : null;
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
              deletedAt: deletedAtMs,
            };
          })
          .filter((cloudEntry) => !tombstoneIdSet.has(cloudEntry.id));

        const uniqueMergedEntries = mergeCloudPullEntries(
          entries,
          transformedCloudData,
          tombstoneIdSet,
        );

        set({ entries: uniqueMergedEntries });

        const storageKey = getStorageKey(currentUserId);
        await saveToStorage(storageKey, uniqueMergedEntries);

        get()._calculateWeather();

        if (__DEV__) console.log("成功从云端同步数据");

        // 从云端同步 firstEntryDate
        await get()._syncFirstEntryDateFromCloud();

        set({ syncStatus: "idle" });
        return true;
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        console.error("从云端同步失败:", errorMsg);
        set({ syncStatus: "error" });
        throw new Error(errorMsg);
      } finally {
        releaseSyncLock();
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
