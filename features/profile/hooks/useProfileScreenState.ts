/**
 * Profile 页面 UI 状态：Modal 开关、表单本地 state、Toast、键盘与滚动 ref
 */

import { useRef, useState } from "react";
import { Animated, type ScrollView, type TextInput } from "react-native";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export type ToastState = {
  message: string;
  type?: "success" | "error" | "info";
} | null;

export function useProfileScreenState() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isCompanionDaysModalOpen, setIsCompanionDaysModalOpen] =
    useState(false);

  const isSyncingRef = useRef(false);
  const modalScrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const isSwitchingModeRef = useRef(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>("");

  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginEmailError, setLoginEmailError] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");
  const [registerNameError, setRegisterNameError] = useState("");
  const [registerEmailError, setRegisterEmailError] = useState("");
  const [registerPasswordError, setRegisterPasswordError] = useState("");
  const [registerConfirmPasswordError, setRegisterConfirmPasswordError] =
    useState("");
  const [loginGlobalError, setLoginGlobalError] = useState("");
  const [registerGlobalError, setRegisterGlobalError] = useState("");

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const registerNameInputRef = useRef<TextInput>(null);
  const registerEmailInputRef = useRef<TextInput>(null);
  const registerPasswordInputRef = useRef<TextInput>(null);
  const registerConfirmPasswordInputRef = useRef<TextInput>(null);

  const globalErrorOpacity = useRef(new Animated.Value(0)).current;

  return {
    isLoading,
    setIsLoading,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isEditProfileOpen,
    setIsEditProfileOpen,
    isRegisterMode,
    setIsRegisterMode,
    isCompanionDaysModalOpen,
    setIsCompanionDaysModalOpen,
    isSyncingRef,
    modalScrollViewRef,
    emailInputRef,
    isSwitchingModeRef,
    syncStatus,
    setSyncStatus,
    lastSyncTime,
    setLastSyncTime,
    syncProgress,
    setSyncProgress,
    editName,
    setEditName,
    editAvatar,
    setEditAvatar,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    registerName,
    setRegisterName,
    loginEmailError,
    setLoginEmailError,
    loginPasswordError,
    setLoginPasswordError,
    registerNameError,
    setRegisterNameError,
    registerEmailError,
    setRegisterEmailError,
    registerPasswordError,
    setRegisterPasswordError,
    registerConfirmPasswordError,
    setRegisterConfirmPasswordError,
    loginGlobalError,
    setLoginGlobalError,
    registerGlobalError,
    setRegisterGlobalError,
    isKeyboardVisible,
    setIsKeyboardVisible,
    toast,
    setToast,
    registerNameInputRef,
    registerEmailInputRef,
    registerPasswordInputRef,
    registerConfirmPasswordInputRef,
    globalErrorOpacity,
  };
}
