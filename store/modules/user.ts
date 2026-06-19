/**
 * 用户模块：认证、资料持久化、firstEntryDate 与游客数据迁移衔接。
 * 通过 get() 调用 entries / 天气等其余 slice，保持组合后行为与内联实现一致。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator } from "zustand";

import { supabase } from "../../lib/supabase";
import { i18n } from "../../i18n";
import { isSoftDeleted } from "../../shared/entries/visibility";
import type { MoodEntry, User } from "../../types";
import { getDefaultAvatar } from "../../utils/avatarPresets";
import { clearEntriesSaveDebounce } from "./entries";
import {
    checkGuestData,
    clearCachedProfile,
    getCachedProfile,
    getStorageKey,
    migrateGuestDataToUser,
    removeFromStorage,
    replaceGuestStorageEntries,
    saveToStorage,
    setCachedProfile,
} from "./storage";
import { AppState, UserModule } from "./types";

const FIRST_ENTRY_DATE_USER_STORAGE_PREFIX = "@first_entry_date_";

/**
 * 登出/注销时写入 `guest_first_entry_date`。
 * 登录态下 `useCompanionFirstEntryDate` 优先读 `@first_entry_date_<userId>`（hook 根据首条记录写入），
 * 该值未必已写回 `user.firstEntryDate`；若登出时只拷贝 `user.firstEntryDate`，游客键为空后会回退到
 * 「未软删条目的最早时间」，旧记录若多为软删则只剩「今天」→ 陪伴天数变成 1。
 * 此处合并 AsyncStorage 用户键、档案字段与**全部**本地条目（含软删）的最早时间戳，取最小值写入游客键。
 */
async function persistGuestFirstEntryDateBridge(
  userId: string,
  userFirstEntryDate: number | undefined,
  entries: MoodEntry[],
): Promise<void> {
  const candidates: number[] = [];
  try {
    const stored = await AsyncStorage.getItem(
      `${FIRST_ENTRY_DATE_USER_STORAGE_PREFIX}${userId}`,
    );
    if (stored) {
      const n = Number.parseInt(stored, 10);
      if (!Number.isNaN(n) && n > 0) candidates.push(n);
    }
  } catch {
    // ignore
  }
  if (userFirstEntryDate != null && userFirstEntryDate > 0) {
    candidates.push(userFirstEntryDate);
  }
  const entryTs = entries
    .map((e) => e.timestamp)
    .filter((t): t is number => typeof t === "number" && t > 0);
  if (entryTs.length > 0) {
    candidates.push(Math.min(...entryTs));
  }
  if (candidates.length === 0) return;
  const best = Math.min(...candidates);
  await AsyncStorage.setItem("guest_first_entry_date", best.toString());
}

/**
 * 会话恢复或登录后：若存在游客键数据则并入用户键并载入内存，否则从用户键加载。
 * 与 `login()` 内逻辑一致，供 `_loadUser`、`onAuthStateChange` 复用。
 */
export async function hydrateEntriesAfterGuestMigration(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  userId: string,
): Promise<void> {
  const guestData = await checkGuestData();

  if (guestData.length > 0) {
    if (__DEV__) {
      console.log(`发现 ${guestData.length} 条游客数据，正在迁移到用户 ${userId}…`);
    }
    const migrationResult = await migrateGuestDataToUser(userId);
    if (migrationResult.success && migrationResult.data) {
      set({ entries: migrationResult.data });
      get()._calculateWeather();
      return;
    }
  }

  await get()._loadEntries();
}

// 登录态与游客态切换时会改存储键并可能迁移条目，须与 storage.getStorageKey 约定保持一致。
export const createUserSlice: StateCreator<
  AppState,
  [],
  [],
  UserModule
> = (set, get, _store) => ({
    user: null,

    _setUser: (user: User | null) => {
      set({ user });
    },

    /**
     * 把 user.firstEntryDate（云端字段）同步到 AsyncStorage 缓存键 `@first_entry_date_<userId>`，
     * 让 useCompanionFirstEntryDate hook 在跨设备首次登录、entries 尚未拉回前也能展示正确的陪伴天数。
     *
     * 注意：hook 自身只读 AsyncStorage 与本地 entries，并不直接读 user.firstEntryDate，
     * 因此这一桥接函数不可移除。语义见 hooks/useCompanionFirstEntryDate.ts 与 store/useAppStore.ts 启动流程。
     */
    initializeFirstEntryDate: async () => {
      const { user } = get();
      if (!user) return;

      // 确保 firstEntryDate 存储到新 key
      const storageKey = `@first_entry_date_${user.id}`;
      try {
        const existing = await AsyncStorage.getItem(storageKey);
        if (existing) return; // 已存在，无需处理

        // 如果 user 有 firstEntryDate，保存到新 key
        if (user.firstEntryDate) {
          await AsyncStorage.setItem(storageKey, user.firstEntryDate.toString());
          return;
        }

        // 如果没有，设置为当前时间
        const now = Date.now();
        await AsyncStorage.setItem(storageKey, now.toString());
      } catch (error) {
        console.error("initializeFirstEntryDate 失败:", error);
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

        await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));

        if (user.email) {
          await get()._syncFirstEntryDateToCloud();
        }
      } else {
        // 游客用户
        const existingDate = await AsyncStorage.getItem(
          "guest_first_entry_date",
        );
        if (!existingDate || timestamp < Number.parseInt(existingDate)) {
          await AsyncStorage.setItem(
            "guest_first_entry_date",
            timestamp.toString(),
          );
        }
      }
    },

    /**
     * 清除firstEntryDate
     * 当删除所有记录时调用
     */
    clearFirstEntryDate: async () => {
      const { user, entries } = get();

      // 仍有未软删记录时不应清除
      if (entries.some((e) => !isSoftDeleted(e))) return;

      if (user) {
        const updatedUser = { ...user, firstEntryDate: undefined };
        set({ user: updatedUser });

        await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));

        if (user.email) {
          await get()._syncFirstEntryDateToCloud();
        }
      } else {
        await AsyncStorage.removeItem("guest_first_entry_date");
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
          .from("profiles")
          .update({
            first_entry_date: user.firstEntryDate || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          // 如果是字段不存在的错误，只记录警告，不影响应用使用
          if (
            error.code === "PGRST204" ||
            error.message?.includes("first_entry_date")
          ) {
            console.warn(
              "数据库中 first_entry_date 字段不存在，请执行数据库迁移。详见: docs/FIRST_ENTRY_DATE_MIGRATION.md",
            );
            console.warn("应用将继续使用本地计算，不影响功能。");
          } else {
            console.error("同步firstEntryDate到云端失败:", error);
          }
        }
      } catch (error) {
        console.error("同步firstEntryDate到云端异常:", error);
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
          .from("profiles")
          .select("first_entry_date")
          .eq("id", user.id)
          .single();

        if (error || !data) return;

        const cloudFirstEntryDate = data.first_entry_date;
        const localFirstEntryDate = user.firstEntryDate;

        // 选择更早的时间戳
        let finalFirstEntryDate: number | undefined;

        if (cloudFirstEntryDate && localFirstEntryDate) {
          finalFirstEntryDate = Math.min(
            cloudFirstEntryDate,
            localFirstEntryDate,
          );
        } else {
          finalFirstEntryDate = cloudFirstEntryDate || localFirstEntryDate;
        }

        // 如果有变化，更新本地和云端
        if (finalFirstEntryDate !== localFirstEntryDate) {
          const updatedUser = { ...user, firstEntryDate: finalFirstEntryDate };
          set({ user: updatedUser });
          await AsyncStorage.setItem(
            "user_session",
            JSON.stringify(updatedUser),
          );
        }

        if (finalFirstEntryDate !== cloudFirstEntryDate) {
          await get()._syncFirstEntryDateToCloud();
        }
      } catch (error) {
        console.error("从云端同步firstEntryDate异常:", error);
      }
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
              session.user.email?.split("@")[0] ||
              "情绪旅者",
            email: session.user.email || "",
            avatar:
              session.user.user_metadata?.avatar ||
              getDefaultAvatar(
                session.user.user_metadata?.name ||
                  session.user.user_metadata?.display_name ||
                  session.user.email?.split("@")[0],
              ),
          };

          // 优先从缓存读取 profile
          const cachedProfile = await getCachedProfile(session.user.id);
          if (cachedProfile) {
            userData = {
              ...userData,
              name: cachedProfile.name || userData.name,
              avatar: cachedProfile.avatar || userData.avatar,
            };
            // 保留现有的 firstEntryDate
            const currentUser = get().user;
            if (currentUser?.firstEntryDate) {
              userData.firstEntryDate = currentUser.firstEntryDate;
            }
            set({ user: userData });
            await AsyncStorage.setItem("user_session", JSON.stringify(userData));
            await hydrateEntriesAfterGuestMigration(get, set, session.user.id);

            // 后台静默更新缓存
            (async () => {
              try {
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", session.user.id)
                  .single();

                if (!profileError && profile) {
                  await setCachedProfile(session.user.id, {
                    userId: session.user.id,
                    name: profile.name || userData.name,
                    avatar: profile.avatar || userData.avatar,
                    email: userData.email,
                  });
                }
              } catch {
                // 静默失败，不影响主流程
              }
            })();
            return;
          }

          // 缓存未命中，从云端获取
          try {
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (!profileError && profile) {
              userData = {
                ...userData,
                name: profile.name || userData.name,
                avatar: profile.avatar || userData.avatar,
              };
              // 更新缓存
              await setCachedProfile(session.user.id, {
                userId: session.user.id,
                name: profile.name || userData.name,
                avatar: profile.avatar || userData.avatar,
                email: userData.email,
              });
            } else if (profileError && profileError.code === "PGRST116") {
              // 创建 profile
              const newProfile = {
                id: session.user.id,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar,
                updated_at: new Date().toISOString(),
              };

              await supabase.from("profiles").insert(newProfile);
              // 更新缓存
              await setCachedProfile(session.user.id, {
                userId: session.user.id,
                name: userData.name,
                avatar: userData.avatar,
                email: userData.email,
              });
            }
          } catch (err) {
            console.error("Profile operation exception:", err);
          }

          // 保留现有的 firstEntryDate
          const currentUser = get().user;
          if (currentUser?.firstEntryDate) {
            userData.firstEntryDate = currentUser.firstEntryDate;
          }

          set({ user: userData });
          await AsyncStorage.setItem("user_session", JSON.stringify(userData));
          await hydrateEntriesAfterGuestMigration(get, set, session.user.id);
        } else {
          set({ user: null });
          await AsyncStorage.removeItem("user_session");
          await get()._loadEntries();
        }
      } catch (error) {
        console.error("Error loading user:", error);
        set({ user: null });
        await get()._loadEntries();
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
          console.error("Registration error:", error);
          if (error.message.includes("User already registered")) {
            throw new Error("User already registered");
          }
          if (error.message.includes("Password should be at least")) {
            throw new Error(
              i18n.t("errors.password_weak", { ns: "auth" }),
            );
          }
          if (error.message.includes("Invalid email")) {
            throw new Error(
              i18n.t("errors.email_invalid", { ns: "auth" }),
            );
          }
          return false;
        }

        if (data.user) {
          return await get().login(email, password);
        }

        return false;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },

    /**
     * 用户登录
     */
    login: async (email: string, password: string) => {
      try {
        if (!email || !password) {
          console.error("邮箱和密码不能为空");
          return false;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("登录失败:", error.message);
          if (error.message.includes("Invalid login credentials")) {
            throw new Error(
              i18n.t("login.invalidCredentials", { ns: "auth" }),
            );
          }
          if (error.message.includes("Email not confirmed")) {
            throw new Error(
              i18n.t("login.emailNotConfirmed", { ns: "auth" }),
            );
          }
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("Network")
          ) {
            throw new Error(
              i18n.t("errors.network_error", { ns: "auth" }),
            );
          }
          return false;
        }

        if (data.user) {
          let userData: User = {
            id: data.user.id,
            name:
              data.user.user_metadata?.name ||
              data.user.user_metadata?.display_name ||
              data.user.email?.split("@")[0] ||
              "情绪旅人",
            email: data.user.email || "",
            avatar:
              data.user.user_metadata?.avatar ||
              getDefaultAvatar(
                data.user.user_metadata?.name ||
                  data.user.user_metadata?.display_name ||
                  data.user.email?.split("@")[0],
              ),
          };

          // 优先从缓存读取 profile
          const cachedProfile = await getCachedProfile(data.user.id);
          
          if (cachedProfile) {
            userData = {
              ...userData,
              name: cachedProfile.name || userData.name,
              avatar: cachedProfile.avatar || userData.avatar,
            };
          }

          // 后台静默更新 profile（无论缓存是否命中）
          (async () => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();

              if (!profileError && profile) {
                // 分别检查 avatar 和 name 是否需要更新
                const hasNewAvatar = !!profile.avatar;
                const hasNewName = !!profile.name;
                
                // 无论是否从缓存加载，只要云端有新数据就更新
                if (hasNewAvatar || hasNewName) {
                  userData = {
                    ...userData,
                    name: hasNewName ? profile.name : userData.name,
                    avatar: hasNewAvatar ? profile.avatar : userData.avatar,
                  };
                  set({ user: userData });
                  await AsyncStorage.setItem("user_session", JSON.stringify(userData));
                }
                
                // 更新缓存（使用 profile 中的值，如果没有则用 userData 中的）
                await setCachedProfile(data.user.id, {
                  userId: data.user.id,
                  name: profile.name || userData.name,
                  avatar: profile.avatar || userData.avatar,
                  email: userData.email,
                });
              } else if (profileError && profileError.code === "PGRST116") {
                const newProfile = {
                  id: data.user.id,
                  name: userData.name,
                  email: userData.email,
                  avatar: userData.avatar,
                  updated_at: new Date().toISOString(),
                };
                await supabase.from("profiles").insert(newProfile);
                await setCachedProfile(data.user.id, {
                  userId: data.user.id,
                  name: userData.name,
                  avatar: userData.avatar,
                  email: userData.email,
                });
              }
            } catch {
              // 静默失败，不影响主流程
            }
          })();

          // 检查用户切换
          const { user: currentUser } = get();
          const isUserSwitching = currentUser && currentUser.id !== userData.id;

          // 保留现有的 firstEntryDate（如果有）
          if (currentUser?.firstEntryDate && !userData.firstEntryDate) {
            userData = { ...userData, firstEntryDate: currentUser.firstEntryDate };
          }

          if (isUserSwitching) {
            if (__DEV__) console.log("检测到用户切换，清除旧账号数据");
            set({ entries: [] });
          }

          set({ user: userData });
          await AsyncStorage.setItem("user_session", JSON.stringify(userData));

          await hydrateEntriesAfterGuestMigration(get, set, userData.id);

          // 初始化 firstEntryDate（新逻辑由 hook 处理，此处仅确保存储到新 key）
          await get().initializeFirstEntryDate();

          return true;
        }

        return false;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },

    /**
     * 用户登出
     */
    logout: async () => {
      try {
        const { user } = get();

        if (!user) {
          set({ user: null });
          await AsyncStorage.removeItem("user_session");
          await get()._loadEntries();
          return;
        }

        clearEntriesSaveDebounce();
        const snapshot = get().entries;
        const userKey = getStorageKey(user.id);
        await saveToStorage(userKey, snapshot);
        await replaceGuestStorageEntries(snapshot);

        await persistGuestFirstEntryDateBridge(
          user.id,
          user.firstEntryDate,
          snapshot,
        );

        // 登出
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Logout error:", error);
        }

        // 清除 profile 缓存
        await clearCachedProfile(user.id);

        set({ user: null });
        await AsyncStorage.removeItem("user_session");
      } catch (error) {
        console.error("Logout error:", error);
        set({ user: null });
        await AsyncStorage.removeItem("user_session");
        await get()._loadEntries();
      }
    },

    /**
     * 注销账号（方案 C - 真删除）
     * 删除云端 Auth 用户、profiles、entries；本地以当前快照写入游客存储后保留。
     */
    deleteAccount: async () => {
      try {
        const { user } = get();
        if (!user) {
          throw new Error("未登录");
        }

        clearEntriesSaveDebounce();
        const snapshot = get().entries;
        const userKey = getStorageKey(user.id);
        await saveToStorage(userKey, snapshot);
        await replaceGuestStorageEntries(snapshot);

        await persistGuestFirstEntryDateBridge(
          user.id,
          user.firstEntryDate,
          snapshot,
        );

        // 3. 调用 Edge Function 删除云端账号
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("会话已失效，请重新登录");
        }

        const { data, error } = await supabase.functions.invoke(
          "delete-account",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (error) {
          throw new Error(error.message || "注销失败");
        }
        if (data?.error) {
          throw new Error(data.error);
        }

        // 4. 本地登出、清除状态
        await supabase.auth.signOut();
        set({ user: null });
        await AsyncStorage.removeItem("user_session");
        await removeFromStorage(getStorageKey(user.id));
        await clearCachedProfile(user.id);

        // 内存中的 entries 与游客键已在注销前对齐，无需再加载
      } catch (error) {
        console.error("Delete account error:", error);
        throw error;
      }
    },

    /**
     * 更新用户信息
     */
    updateUser: async (updates: Partial<User>) => {
      const { user } = get();
      if (!user) return;

      try {
        // 先尝试更新，如果 profile 不存在则插入
        const { error } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            ...updates,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Error updating user profile:", error);
          throw error;
        }

        const updatedUser = { ...user, ...updates };
        set({ user: updatedUser });
        await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));
        
        // 同步更新 profile 缓存
        if (updates.name !== undefined || updates.avatar !== undefined) {
          const cachedProfile = await getCachedProfile(user.id);
          if (cachedProfile) {
            await setCachedProfile(user.id, {
              userId: user.id,
              name: updates.name ?? cachedProfile.name,
              avatar: updates.avatar ?? cachedProfile.avatar,
              email: user.email ?? cachedProfile.email,
            });
          } else {
            // 缓存不存在时，创建新缓存
            await setCachedProfile(user.id, {
              userId: user.id,
              name: updates.name ?? user.name,
              avatar: updates.avatar ?? user.avatar,
              email: user.email,
            });
          }
        }
      } catch (error) {
        console.error("Error updating user:", error);
        throw error;
      }
    },
});
