/**
 * 用户模块：认证、资料持久化、firstEntryDate 与游客数据迁移衔接。
 * 通过 get() 调用 entries / 天气等其余 slice，保持组合后行为与内联实现一致。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StateCreator } from "zustand";

import { supabase } from "../../lib/supabase";
import { User } from "../../types";
import { getDefaultAvatar } from "../../utils/avatarPresets";
import {
  checkGuestData,
  clearCachedProfile,
  getCachedProfile,
  getStorageKey,
  migrateGuestDataToUser,
  migrateUserDataToGuest,
  removeFromStorage,
  saveToStorage,
  setCachedProfile,
} from "./storage";
import { AppStore, UserModule } from "./types";

// 登录态与游客态切换时会改存储键并可能迁移条目，须与 storage.getStorageKey 约定保持一致。
export const createUserSlice: StateCreator<
  AppStore,
  [],
  [],
  UserModule
> = (set, get, _store) => ({
    user: null,

    _setUser: (user: User | null) => {
      set({ user });
    },

    /**
     * 初始化firstEntryDate
     * 取以下三个来源的最小值：
     * 1. user.firstEntryDate (云端值)
     * 2. guest_first_entry_date (游客本地)
     * 3. entries 中最早的记录
     * 确保陪伴日期不丢失、一致
     */
    initializeFirstEntryDate: async () => {
      const { user, entries } = get();

      // 收集所有可能的 firstEntryDate 来源
      let candidates: number[] = [];

      // 1. 添加云端的 firstEntryDate
      if (user?.firstEntryDate) {
        candidates.push(user.firstEntryDate);
      }

      // 2. 添加游客本地的 firstEntryDate
      try {
        const guestDate = await AsyncStorage.getItem("guest_first_entry_date");
        if (guestDate) {
          const guestTimestamp = parseInt(guestDate, 10);
          if (guestTimestamp > 0) {
            candidates.push(guestTimestamp);
          }
        }
      } catch (error) {
        console.error("读取游客 firstEntryDate 失败:", error);
      }

      // 3. 添加 entries 中最早的记录时间戳（只添加有效的正数时间戳）
      if (entries.length > 0) {
        const validTimestamps = entries.map((e) => e.timestamp).filter((t) => t > 0);
        if (validTimestamps.length > 0) {
          const oldestEntryTimestamp = Math.min(...validTimestamps);
          candidates.push(oldestEntryTimestamp);
        }
      }

      // 如果没有有效的候选值，无需初始化
      if (candidates.length === 0) {
        // 新用户没有任何记录：将 firstEntryDate 设置为当前时间（用户第一次进入 app 的时间）
        if (user && !user.firstEntryDate) {
          const now = Date.now();
          const updatedUser = { ...user, firstEntryDate: now };
          set({ user: updatedUser });
          await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));
          if (user.email) {
            await get()._syncFirstEntryDateToCloud();
          }
        }
        return;
      }

      // 取所有候选值中的最小值（最早的日期），确保是有效的正数时间戳
      let finalTimestamp = Math.min(...candidates);
      if (finalTimestamp <= 0) {
        finalTimestamp = Date.now();
      }

      // 只有当 user 存在时才更新
      if (user) {
        // 检查是否需要更新
        const shouldUpdate = !user.firstEntryDate || finalTimestamp < user.firstEntryDate;

        if (shouldUpdate) {
          const updatedUser = { ...user, firstEntryDate: finalTimestamp };
          set({ user: updatedUser });

          // 保存到本地存储
          await AsyncStorage.setItem("user_session", JSON.stringify(updatedUser));

          // 如果已登录，同步到云端
          if (user.email) {
            await get()._syncFirstEntryDateToCloud();
          }
        }

        // 清除游客的 firstEntryDate（已合并到用户数据）
        await AsyncStorage.removeItem("guest_first_entry_date");
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
        if (!existingDate || timestamp < parseInt(existingDate)) {
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

      // 只有在没有记录时才清除
      if (entries.length > 0) return;

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
            set({ user: userData });
            await AsyncStorage.setItem("user_session", JSON.stringify(userData));
            get()._loadEntries();
            
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

          set({ user: userData });
          get()._loadEntries();
        } else {
          set({ user: null });
          await AsyncStorage.removeItem("user_session");
          get()._loadEntries();
        }
      } catch (error) {
        console.error("Error loading user:", error);
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
          console.error("Registration error:", error);
          if (error.message.includes("User already registered")) {
            throw new Error("User already registered");
          }
          if (error.message.includes("Password should be at least")) {
            throw new Error("密码强度不足，请尝试设置更复杂的密码");
          }
          if (error.message.includes("Invalid email")) {
            throw new Error("邮箱格式不正确，请确认后重试");
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
            throw new Error("邮箱或密码不正确");
          }
          if (error.message.includes("Email not confirmed")) {
            throw new Error("邮箱尚未完成验证，请先前往邮箱完成验证");
          }
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("Network")
          ) {
            throw new Error("网络连接异常，请稍后重试");
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

          if (isUserSwitching) {
            if (__DEV__) console.log("检测到用户切换，清除旧账号数据");
            set({ entries: [] });
          }

          set({ user: userData });
          await AsyncStorage.setItem("user_session", JSON.stringify(userData));

          // 检查游客数据迁移
          const guestData = await checkGuestData();
          
          if (guestData.length > 0) {
            if (__DEV__) console.log(`发现 ${guestData.length} 条游客数据，正在迁移...`);
            const migrationResult = await migrateGuestDataToUser(userData.id);
            if (migrationResult.success && migrationResult.data) {
              set({ entries: migrationResult.data });
              get()._calculateWeather();
            } else {
              await get()._loadEntries();
            }
          } else {
            await get()._loadEntries();
          }

          // 确保 entries 加载完成后再初始化 firstEntryDate
          // 避免竞态条件：initializeFirstEntryDate 需要读取 entries 来确定最早的记录时间
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
        const { user, entries } = get();

        if (!user) {
          set({ user: null });
          await AsyncStorage.removeItem("user_session");
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
          await AsyncStorage.setItem(
            "guest_first_entry_date",
            user.firstEntryDate.toString(),
          );
        }

        // 合并到游客存储
        const migrationResult = await migrateUserDataToGuest(user.id);

        // 登出
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Logout error:", error);
        }

        // 清除 profile 缓存
        await clearCachedProfile(user.id);

        set({ user: null });
        await AsyncStorage.removeItem("user_session");

        // 更新数据
        if (migrationResult.success && migrationResult.data) {
          set({ entries: migrationResult.data });
          get()._calculateWeather();
        } else {
          await get()._loadEntries();
        }
      } catch (error) {
        console.error("Logout error:", error);
        set({ user: null });
        await AsyncStorage.removeItem("user_session");
        await get()._loadEntries();
      }
    },

    /**
     * 注销账号（方案 C - 真删除）
     * 删除云端 Auth 用户、profiles、entries，本地数据迁移到游客存储保留
     */
    deleteAccount: async () => {
      try {
        const { user, entries } = get();
        if (!user) {
          throw new Error("未登录");
        }

        // 1. 保存当前数据到用户存储
        if (entries.length > 0) {
          const userKey = getStorageKey(user.id);
          await saveToStorage(userKey, entries);
        }

        // 2. 保存 firstEntryDate 到游客存储（确保注销后陪伴天数不丢失）
        if (user.firstEntryDate) {
          await AsyncStorage.setItem(
            "guest_first_entry_date",
            user.firstEntryDate.toString(),
          );
        }

        // 3. 合并用户数据到游客存储
        const migrationResult = await migrateUserDataToGuest(user.id);

        // 4. 调用 Edge Function 删除云端账号
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

        // 5. 本地登出、清除状态
        await supabase.auth.signOut();
        set({ user: null });
        await AsyncStorage.removeItem("user_session");
        await removeFromStorage(getStorageKey(user.id));
        await clearCachedProfile(user.id);

        // 6. 恢复游客数据
        if (migrationResult.success && migrationResult.data) {
          set({ entries: migrationResult.data });
          get()._calculateWeather();
        } else {
          await get()._loadEntries();
        }
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
