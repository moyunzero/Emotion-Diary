/**
 * Profile 认证与资料：handleAuthSubmit、handleSaveProfile、注册切换等与 store 的调用链
 */

import { useCallback } from "react";
import { Alert, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { getDefaultAvatar } from "@/utils/avatarPresets";
import type { ToastState } from "./useProfileScreenState";

const tError = (key: string): string => {
  const map: Record<string, string> = {
    username_required: "昵称不能为空，请输入 2-20 个字符",
    email_required: "邮箱不能为空，请输入有效的邮箱地址",
    email_invalid: "邮箱格式不正确，请检查后重新输入",
    password_required: "密码不能为空",
    password_weak: "密码需为 6-20 位，包含字母和数字",
    confirm_required: "请再次输入密码进行确认",
    confirm_mismatch: "两次输入的密码不一致，请重新确认",
    network_error: "网络异常，请稍后重试",
    register_failed: "注册失败，请稍后重试",
    email_registered: "该邮箱已被注册，请直接登录",
  };
  return map[key] || key;
};

export type AuthState = {
  isLoading: boolean;
  isRegisterMode: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  registerName: string;
  loginEmailError: string;
  loginPasswordError: string;
  registerNameError: string;
  registerEmailError: string;
  registerPasswordError: string;
  registerConfirmPasswordError: string;
  loginGlobalError: string;
  registerGlobalError: string;
  editName: string;
  editAvatar: string;
  setIsLoginModalOpen: (v: boolean) => void;
  setIsEditProfileOpen: (v: boolean) => void;
  setIsRegisterMode: (v: boolean) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  setRegisterName: (v: string) => void;
  setLoginEmailError: (v: string) => void;
  setLoginPasswordError: (v: string) => void;
  setRegisterNameError: (v: string) => void;
  setRegisterEmailError: (v: string) => void;
  setRegisterPasswordError: (v: string) => void;
  setRegisterConfirmPasswordError: (v: string) => void;
  setLoginGlobalError: (v: string) => void;
  setRegisterGlobalError: (v: string) => void;
  setEditName: (v: string) => void;
  setEditAvatar: (v: string) => void;
  setIsLoading: (v: boolean) => void;
  setToast: (v: ToastState) => void;
  globalErrorOpacity: Animated.Value;
  emailInputRef: React.RefObject<{ focus: () => void } | null>;
  modalScrollViewRef: React.RefObject<{ scrollTo: (p: { y: number; animated: boolean }) => void } | null>;
  registerNameInputRef: React.RefObject<{ focus: () => void } | null>;
  registerEmailInputRef: React.RefObject<{ focus: () => void } | null>;
  registerPasswordInputRef: React.RefObject<{ focus: () => void } | null>;
  registerConfirmPasswordInputRef: React.RefObject<{ focus: () => void } | null>;
  isSwitchingModeRef: React.MutableRefObject<boolean>;
};

export function useProfileAuthHandlers(state: AuthState) {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);
  const deleteAccount = useAppStore((s) => s.deleteAccount);
  const updateUser = useAppStore((s) => s.updateUser);
  const register = useAppStore((s) => s.register);
  const user = useAppStore((s) => s.user);

  const validateEmail = useCallback((value: string) => {
    if (!value.trim()) return tError("email_required");
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value.trim())) return tError("email_invalid");
    return "";
  }, []);

  const validatePassword = useCallback((value: string, isRegister: boolean) => {
    if (!value.trim()) return tError("password_required");
    if (isRegister && value.trim().length < 6) return tError("password_weak");
    return "";
  }, []);

  const showGlobalError = useCallback(
    (message: string) => {
      state.globalErrorOpacity.setValue(0);
      Animated.timing(state.globalErrorOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      state.setRegisterGlobalError(message);
    },
    [state],
  );

  const handleSwitchMode = useCallback(() => {
    state.isSwitchingModeRef.current = true;
    state.modalScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    const newMode = !state.isRegisterMode;
    state.setIsRegisterMode(newMode);
    state.setEmail("");
    state.setPassword("");
    state.setConfirmPassword("");
    state.setRegisterName("");
    state.setLoginEmailError("");
    state.setLoginPasswordError("");
    state.setRegisterNameError("");
    state.setRegisterEmailError("");
    state.setRegisterPasswordError("");
    state.setRegisterConfirmPasswordError("");
    state.setLoginGlobalError("");
    state.setRegisterGlobalError("");
    if (newMode === false) {
      const delay = Platform.OS === "android" ? 500 : 250;
      setTimeout(() => state.emailInputRef.current?.focus(), delay);
    }
    const clearDelay = Platform.OS === "android" ? 300 : 100;
    setTimeout(() => {
      state.isSwitchingModeRef.current = false;
    }, clearDelay);
  }, [state]);

  const handleLogin = useCallback(async () => {
    state.setLoginGlobalError("");
    state.setRegisterGlobalError("");

    if (!state.isRegisterMode) {
      const emailError = validateEmail(state.email);
      const passwordError = validatePassword(state.password, false);
      state.setLoginEmailError(emailError);
      state.setLoginPasswordError(passwordError);
      if (emailError || passwordError) return;
    } else {
      const nameError = state.registerName.trim()
        ? ""
        : tError("username_required");
      const emailError = validateEmail(state.email);
      const passwordError = (() => {
        if (!state.password.trim()) return tError("password_required");
        if (state.password.trim().length < 6) return tError("password_weak");
        return "";
      })();
      const confirmError = state.confirmPassword.trim()
        ? ""
        : tError("confirm_required");
      const mismatchError =
        state.password &&
        state.confirmPassword &&
        state.password !== state.confirmPassword
          ? tError("confirm_mismatch")
          : "";
      const finalConfirmError = mismatchError || confirmError;
      state.setRegisterNameError(nameError);
      state.setRegisterEmailError(emailError);
      state.setRegisterPasswordError(passwordError);
      state.setRegisterConfirmPasswordError(finalConfirmError);
      if (nameError || emailError || passwordError || finalConfirmError) {
        if (nameError) state.registerNameInputRef.current?.focus();
        else if (emailError) state.registerEmailInputRef.current?.focus();
        else if (passwordError) state.registerPasswordInputRef.current?.focus();
        else if (finalConfirmError)
          state.registerConfirmPasswordInputRef.current?.focus();
        return;
      }
    }

    state.setIsLoading(true);
    try {
      if (state.isRegisterMode) {
        try {
          const success = await register(
            state.email,
            state.password,
            state.registerName,
          );
          if (success) {
            state.setIsLoginModalOpen(false);
            state.setEmail("");
            state.setPassword("");
            state.setConfirmPassword("");
            state.setRegisterName("");
            state.setRegisterNameError("");
            state.setRegisterEmailError("");
            state.setRegisterPasswordError("");
            state.setRegisterConfirmPasswordError("");
            state.setRegisterGlobalError("");
          } else {
            showGlobalError(tError("register_failed"));
            state.setToast({
              message: tError("register_failed"),
              type: "error",
            });
          }
        } catch (error: unknown) {
          const err = error as { message?: string };
          if (err.message?.includes("User already registered")) {
            state.setIsRegisterMode(false);
            state.setPassword("");
            state.setConfirmPassword("");
            state.setRegisterName("");
            state.setRegisterGlobalError("");
            state.setLoginGlobalError(tError("email_registered"));
            state.setToast({
              message: tError("email_registered"),
              type: "info",
            });
          } else {
            const message =
              err?.message?.includes("Network") ||
              err?.message?.includes("Failed to fetch")
                ? tError("network_error")
                : err?.message || tError("register_failed");
            showGlobalError(message);
            state.setToast({ message, type: "error" });
          }
        }
      } else {
        const success = await login(state.email, state.password);
        if (success) {
          state.setIsLoginModalOpen(false);
          state.setEmail("");
          state.setPassword("");
          state.setLoginEmailError("");
          state.setLoginPasswordError("");
          state.setLoginGlobalError("");
        } else {
          state.setLoginGlobalError("登录失败，请检查邮箱和密码是否正确");
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (state.isRegisterMode) {
        state.setRegisterGlobalError(err?.message || "注册失败，请稍后重试");
      } else {
        state.setLoginGlobalError(err?.message || "登录失败，请稍后重试");
      }
    } finally {
      state.setIsLoading(false);
    }
  }, [state, login, register, validateEmail, validatePassword, showGlobalError]);

  const openEditProfile = useCallback(() => {
    if (!user) return;
    state.setEditName(user.name);
    state.setEditAvatar(user.avatar || getDefaultAvatar(user.name));
    state.setIsEditProfileOpen(true);
  }, [user, state]);

  const handleSaveProfile = useCallback(async () => {
    if (!state.editName.trim()) {
      Alert.alert("提示", "昵称不能为空哦");
      return;
    }
    state.setIsLoading(true);
    try {
      await updateUser({
        name: state.editName,
        avatar: state.editAvatar,
      });
      state.setIsEditProfileOpen(false);
    } catch {
      Alert.alert("保存失败", "请稍后重试");
    } finally {
      state.setIsLoading(false);
    }
  }, [state, updateUser]);

  const handleLogout = useCallback(() => {
    Alert.alert("退出登录", "确定要退出吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          state.setIsLoading(true);
          try {
            await logout();
            router.back();
          } catch {
            Alert.alert("退出失败", "请稍后重试");
          } finally {
            state.setIsLoading(false);
          }
        },
      },
    ]);
  }, [state, logout, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "注销账号",
      "注销后，您的云端账号及所有心事记录将被永久删除，无法恢复。本地记录将转为游客模式保留。\n\n确定要注销吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认注销",
          style: "destructive",
          onPress: async () => {
            state.setIsLoading(true);
            try {
              await deleteAccount();
              state.setToast({ message: "账号已注销", type: "success" });
              router.back();
            } catch (e: unknown) {
              const err = e as { message?: string };
              Alert.alert("注销失败", err?.message || "请稍后重试");
            } finally {
              state.setIsLoading(false);
            }
          },
        },
      ],
    );
  }, [state, deleteAccount, router]);

  return {
    tError,
    validateEmail,
    validatePassword,
    handleLogin,
    handleSwitchMode,
    openEditProfile,
    handleSaveProfile,
    handleLogout,
    handleDeleteAccount,
  };
}
