import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  CloudDownload,
  CloudUpload,
  LogOut,
  User as UserIcon,
  UserX,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CompanionDaysCard from "@/components/CompanionDaysCard";
import CompanionDaysModal from "@/components/CompanionDaysModal";
import {
  ProfileHeader,
  ProfileMenuItem,
  ProfileSectionHeader,
  ProfileStatCard,
  ProfileUserCard,
} from "@/components/Profile";
import ScreenContainer from "@/components/ScreenContainer";
import { Toast } from "@/components/Toast";
import { useAppStore } from "@/store/useAppStore";
import {
  profileContentPadding,
  profileStyles,
} from "@/styles/components/Profile.styles";
import { AVATAR_PRESETS, getDefaultAvatar } from "@/utils/avatarPresets";

const { height: windowHeight } = Dimensions.get("window");

const AVATARS = AVATAR_PRESETS;

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((state) => state.user);
  const entries = useAppStore((state) => state.entries);
  const weather = useAppStore((state) => state.weather);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const updateUser = useAppStore((state) => state.updateUser);
  const syncToCloud = useAppStore((state) => state.syncToCloud);
  const register = useAppStore((state) => state.register);
  const recoverFromCloud = useAppStore((state) => state.recoverFromCloud);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isCompanionDaysModalOpen, setIsCompanionDaysModalOpen] =
    useState(false);

  // 使用 ref 防止同步操作重复触发
  const isSyncingRef = useRef(false);

  // ScrollView ref 用于重置滚动位置
  const modalScrollViewRef = useRef<ScrollView>(null);

  // 邮箱输入框 ref，用于在模式切换后自动聚焦
  const emailInputRef = useRef<TextInput>(null);

  // 使用 ref 防止模式切换时触发Modal关闭（Android平台问题）
  const isSwitchingModeRef = useRef(false);

  // Sync State
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle");
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>("");

  // Edit Profile State
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  // Login/Register State
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
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const registerNameInputRef = useRef<TextInput>(null);
  const registerEmailInputRef = useRef<TextInput>(null);
  const registerPasswordInputRef = useRef<TextInput>(null);
  const registerConfirmPasswordInputRef = useRef<TextInput>(null);

  const globalErrorOpacity = useRef(new Animated.Value(0)).current;

  // 加载最后同步时间
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const time = await AsyncStorage.getItem("last_sync_time");
        if (time) {
          setLastSyncTime(parseInt(time, 10));
        }
      } catch {
        // console.error("加载最后同步时间失败:", error);
      }
    };
    loadLastSyncTime();
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 监听模式切换，确保输入框可以正常获得焦点
  useEffect(() => {
    if (isLoginModalOpen && !isRegisterMode) {
      const timer = setTimeout(
        () => {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
          }
        },
        Platform.OS === "android" ? 500 : 250,
      );
      return () => clearTimeout(timer);
    }
  }, [isLoginModalOpen, isRegisterMode]);

  const handleBack = () => {
    router.back();
  };

  const handleSyncAction = async (type: "upload" | "download") => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (isSyncingRef.current || isLoading) {
      return;
    }

    isSyncingRef.current = true;
    setIsLoading(true);
    setSyncStatus("syncing");
    setSyncProgress(
      type === "upload" ? "正在备份到云端..." : "正在从云端同步...",
    );

    try {
      if (type === "upload") {
        await syncToCloud();
        const now = Date.now();
        setLastSyncTime(now);
        await AsyncStorage.setItem("last_sync_time", now.toString());
        const currentEntries = useAppStore.getState().entries;
        setSyncStatus("success");
        setSyncProgress(`成功备份 ${currentEntries.length} 条记录`);
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncProgress("");
        }, 2000);
      } else {
        await recoverFromCloud();
        const now = Date.now();
        setLastSyncTime(now);
        await AsyncStorage.setItem("last_sync_time", now.toString());
        const currentEntries = useAppStore.getState().entries;
        setSyncStatus("success");
        setSyncProgress(`成功同步 ${currentEntries.length} 条记录`);
        setTimeout(() => {
          setSyncStatus("idle");
          setSyncProgress("");
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "操作失败，请稍后重试";
      setSyncStatus("error");
      setSyncProgress(errorMessage);
      setTimeout(() => {
        setSyncStatus("idle");
        setSyncProgress("");
      }, 3000);
    } finally {
      setIsLoading(false);
      isSyncingRef.current = false;
    }
  };

  const formatLastSyncTime = (timestamp: number | null) => {
    if (!timestamp) return "从未同步";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚同步";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleSwitchMode = () => {
    isSwitchingModeRef.current = true;
    modalScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    const newMode = !isRegisterMode;
    setIsRegisterMode(newMode);

    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRegisterName("");
    setLoginEmailError("");
    setLoginPasswordError("");
    setRegisterNameError("");
    setRegisterEmailError("");
    setRegisterPasswordError("");
    setRegisterConfirmPasswordError("");
    setLoginGlobalError("");
    setRegisterGlobalError("");

    if (newMode === false) {
      setTimeout(
        () => {
          emailInputRef.current?.focus();
        },
        Platform.OS === "android" ? 500 : 250,
      );
    }

    setTimeout(
      () => {
        isSwitchingModeRef.current = false;
      },
      Platform.OS === "android" ? 300 : 100,
    );
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      return tError("email_required");
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value.trim())) {
      return tError("email_invalid");
    }
    return "";
  };

  const validatePassword = (value: string, isRegister: boolean) => {
    if (!value.trim()) {
      return tError("password_required");
    }
    if (isRegister && value.trim().length < 6) {
      return tError("password_weak");
    }
    return "";
  };

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

  const showGlobalError = (message: string) => {
    globalErrorOpacity.setValue(0);
    Animated.timing(globalErrorOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    setRegisterGlobalError(message);
  };

  const handleLogin = async () => {
    setLoginGlobalError("");
    setRegisterGlobalError("");

    if (!isRegisterMode) {
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password, false);
      setLoginEmailError(emailError);
      setLoginPasswordError(passwordError);
      if (emailError || passwordError) {
        return;
      }
    } else {
      const nameError = registerName.trim() ? "" : tError("username_required");
      const emailError = validateEmail(email);
      const passwordError = (() => {
        if (!password.trim()) return tError("password_required");
        if (password.trim().length < 6) return tError("password_weak");
        return "";
      })();
      const confirmError = confirmPassword.trim()
        ? ""
        : tError("confirm_required");
      const mismatchError =
        password && confirmPassword && password !== confirmPassword
          ? tError("confirm_mismatch")
          : "";
      const finalConfirmError = mismatchError || confirmError;
      setRegisterNameError(nameError);
      setRegisterEmailError(emailError);
      setRegisterPasswordError(passwordError);
      setRegisterConfirmPasswordError(finalConfirmError);
      if (nameError || emailError || passwordError || finalConfirmError) {
        if (nameError) {
          registerNameInputRef.current?.focus();
        } else if (emailError) {
          registerEmailInputRef.current?.focus();
        } else if (passwordError) {
          registerPasswordInputRef.current?.focus();
        } else if (finalConfirmError) {
          registerConfirmPasswordInputRef.current?.focus();
        }
        return;
      }
    }

    setIsLoading(true);
    try {
      let success = false;

      if (isRegisterMode) {
        try {
          success = await register(email, password, registerName);
          if (success) {
            setIsLoginModalOpen(false);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setRegisterName("");
            setRegisterNameError("");
            setRegisterEmailError("");
            setRegisterPasswordError("");
            setRegisterConfirmPasswordError("");
            setRegisterGlobalError("");
          } else {
            console.error("Register failed without explicit error");
            showGlobalError(tError("register_failed"));
            setToast({
              message: tError("register_failed"),
              type: "error",
            });
          }
        } catch (error: any) {
          console.error("Register error:", error);
          if (
            error.message &&
            error.message.includes("User already registered")
          ) {
            setIsRegisterMode(false);
            setPassword("");
            setConfirmPassword("");
            setRegisterName("");
            setRegisterGlobalError("");
            setLoginGlobalError(tError("email_registered"));
            setToast({
              message: tError("email_registered"),
              type: "info",
            });
          } else {
            const message =
              error?.message?.includes("Network") ||
              error?.message?.includes("Failed to fetch")
                ? tError("network_error")
                : error?.message || tError("register_failed");
            showGlobalError(message);
            setToast({
              message,
              type: "error",
            });
          }
        }
      } else {
        success = await login(email, password);
        if (success) {
          setIsLoginModalOpen(false);
          setEmail("");
          setPassword("");
          setLoginEmailError("");
          setLoginPasswordError("");
          setLoginGlobalError("");
        } else {
          setLoginGlobalError("登录失败，请检查邮箱和密码是否正确");
        }
      }
    } catch (error: any) {
      if (isRegisterMode) {
        setRegisterGlobalError(error?.message || "注册失败，请稍后重试");
      } else {
        setLoginGlobalError(error?.message || "登录失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openEditProfile = () => {
    if (!user) return;
    setEditName(user.name);
    setEditAvatar(user.avatar || getDefaultAvatar(user.name));
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("提示", "昵称不能为空哦");
      return;
    }
    setIsLoading(true);
    try {
      await updateUser({ name: editName, avatar: editAvatar });
      setIsEditProfileOpen(false);
    } catch {
      Alert.alert("保存失败", "请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("退出登录", "确定要退出吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "退出",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await logout();
            router.back();
          } catch {
            Alert.alert("退出失败", "请稍后重试");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "注销账号",
      "注销后，您的云端账号及所有心事记录将被永久删除，无法恢复。本地记录将转为游客模式保留。\n\n确定要注销吗？",
      [
        { text: "取消", style: "cancel" },
        {
          text: "确认注销",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteAccount();
              setToast({ message: "账号已注销", type: "success" });
              router.back();
            } catch (e: any) {
              Alert.alert("注销失败", e?.message || "请稍后重试");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={profileStyles.container}>
      <View style={profileStyles.bgCircle} />

      <ScreenContainer
        edges={["top", "bottom"]}
        scrollable
        contentContainerStyle={profileContentPadding}
      >
        <ProfileHeader onBack={handleBack} />

        <ProfileUserCard
          avatarUri={user?.avatar}
          name={user?.name}
          handle={user ? user.email || `@user_${user.id.slice(0, 8)}` : null}
          moodText={
            user ? `今日心情: ${weather.score > 20 ? "🌧️" : "☀️"}` : undefined
          }
          isLoggedIn={!!user}
          onPress={user ? openEditProfile : () => setIsLoginModalOpen(true)}
        />

        <View style={profileStyles.statsContainer}>
          <ProfileStatCard value={entries.length} label="心事记录" />
          <ProfileStatCard value={weather.score} label="心情指数" accent />
          <CompanionDaysCard
            onPress={() => setIsCompanionDaysModalOpen(true)}
          />
        </View>

        <View style={profileStyles.menuContainer}>
          <ProfileSectionHeader title="数据与安全" />

          {user && (
            <View style={profileStyles.syncStatusContainer}>
              <View style={profileStyles.syncStatusRow}>
                <View style={profileStyles.syncStatusLeft}>
                  {syncStatus === "syncing" && (
                    <ActivityIndicator
                      size="small"
                      color="#3B82F6"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {syncStatus === "success" && (
                    <CheckCircle
                      size={16}
                      color="#10B981"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {syncStatus === "error" && (
                    <X size={16} color="#EF4444" style={{ marginRight: 8 }} />
                  )}
                  <Text style={profileStyles.syncStatusText}>
                    {syncProgress ||
                      `最后同步：${formatLastSyncTime(lastSyncTime)}`}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={profileStyles.menuGroup}>
            <ProfileMenuItem
              icon={<CloudUpload size={20} color="#EF4444" />}
              iconBgColor="#FEF2F2"
              title="备份心事"
              subtext={syncStatus === "syncing" ? "正在备份..." : undefined}
              showChevron={syncStatus !== "syncing"}
              disabled={isLoading}
              onPress={() => handleSyncAction("upload")}
            />
            <View style={profileStyles.menuDivider} />
            <ProfileMenuItem
              icon={<CloudDownload size={20} color="#3B82F6" />}
              iconBgColor="#EFF6FF"
              title="找回回忆"
              subtext={syncStatus === "syncing" ? "正在同步..." : undefined}
              showChevron={syncStatus !== "syncing"}
              disabled={isLoading}
              onPress={() => handleSyncAction("download")}
            />
          </View>

          {user && (
            <>
              <ProfileSectionHeader title="其他" />
              <View style={profileStyles.menuGroup}>
                <ProfileMenuItem
                  icon={<LogOut size={20} color="#EF4444" />}
                  iconBgColor="#FEF2F2"
                  title="退出登录"
                  showChevron={false}
                  danger
                  onPress={handleLogout}
                />
                <View style={profileStyles.menuDivider} />
                <ProfileMenuItem
                  icon={<UserX size={20} color="#EF4444" />}
                  iconBgColor="#FEF2F2"
                  title="注销账号"
                  subtext="永久删除云端账号及数据，本地记录保留"
                  showChevron={false}
                  danger
                  onPress={handleDeleteAccount}
                />
              </View>
            </>
          )}
        </View>
      </ScreenContainer>

      {isLoading && (
        <View style={profileStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      )}

      {/* Login Modal */}
      <Modal
        visible={isLoginModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (Platform.OS === "android" && isSwitchingModeRef.current) {
            return;
          }
          Keyboard.dismiss();
          setIsLoginModalOpen(false);
          setIsRegisterMode(false);
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setRegisterName("");
          setLoginEmailError("");
          setLoginPasswordError("");
          setRegisterNameError("");
          setRegisterEmailError("");
          setRegisterPasswordError("");
          setRegisterConfirmPasswordError("");
          setLoginGlobalError("");
          setRegisterGlobalError("");
        }}
        statusBarTranslucent={true}
      >
        <View style={modalStyles.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={modalStyles.modalOverlayBackground} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={modalStyles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View
              style={[
                modalStyles.modalContent,
                {
                  marginTop: insets.top + 20,
                  marginBottom: Math.max(insets.bottom, 20),
                  maxHeight: Math.min(
                    windowHeight * 0.75,
                    windowHeight -
                      insets.top -
                      Math.max(insets.bottom, 20) -
                      40,
                  ),
                },
              ]}
            >
              <TouchableOpacity
                style={modalStyles.closeButton}
                onPress={() => {
                  setIsLoginModalOpen(false);
                  setIsRegisterMode(false);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setRegisterName("");
                  setLoginEmailError("");
                  setLoginPasswordError("");
                  setRegisterNameError("");
                  setRegisterEmailError("");
                  setRegisterPasswordError("");
                  setRegisterConfirmPasswordError("");
                  setLoginGlobalError("");
                  setRegisterGlobalError("");
                }}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <ScrollView
                ref={modalScrollViewRef}
                style={modalStyles.modalScrollView}
                contentContainerStyle={modalStyles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
              >
                <View style={modalStyles.modalHeader}>
                  <View style={modalStyles.loginIconBox}>
                    <UserIcon size={32} color="#EF4444" />
                  </View>
                  <Text style={modalStyles.modalTitle}>
                    {isRegisterMode ? "创建账号" : "开启云端守护"}
                  </Text>
                  <Text style={modalStyles.modalSubtitle}>
                    {isRegisterMode
                      ? "注册账号，让情绪记录永久保存"
                      : "登录后，您的情绪记录将安全地存储在云端，随时随地找回。"}
                  </Text>
                </View>

                {!isRegisterMode ? (
                  <View style={modalStyles.formContainer} key="login-form">
                    <View style={modalStyles.inputContainer}>
                      <Text style={modalStyles.inputLabel}>邮箱</Text>
                      <TextInput
                        key="login-email-input"
                        ref={emailInputRef}
                        style={modalStyles.input}
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);
                          if (!isRegisterMode) {
                            setLoginEmailError(validateEmail(value));
                          } else {
                            setRegisterEmailError(validateEmail(value));
                          }
                        }}
                        placeholder="输入你的邮箱地址"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        editable={true}
                        selectTextOnFocus={false}
                        returnKeyType="next"
                        onSubmitEditing={() => {
                          setTimeout(() => {
                            modalScrollViewRef.current?.scrollToEnd({
                              animated: true,
                            });
                          }, 100);
                        }}
                        blurOnSubmit={false}
                        onFocus={() => {}}
                      />
                    </View>

                    <View style={modalStyles.inputContainer}>
                      <Text style={modalStyles.inputLabel}>密码</Text>
                      <TextInput
                        style={modalStyles.input}
                        value={password}
                        onChangeText={(value) => {
                          setPassword(value);
                          if (!isRegisterMode) {
                            setLoginPasswordError(
                              validatePassword(value, false),
                            );
                          } else {
                            setRegisterPasswordError(
                              validatePassword(value, true),
                            );
                            if (confirmPassword) {
                              if (value !== confirmPassword) {
                                setRegisterConfirmPasswordError(
                                  "两次输入的密码不一致",
                                );
                              } else {
                                setRegisterConfirmPasswordError("");
                              }
                            }
                          }
                        }}
                        placeholder="输入你的密码"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        onFocus={() => {
                          setTimeout(() => {
                            modalScrollViewRef.current?.scrollToEnd({
                              animated: true,
                            });
                          }, 100);
                        }}
                      />
                    </View>
                    {loginEmailError ? (
                      <Text style={modalStyles.errorText}>{loginEmailError}</Text>
                    ) : null}
                    {loginPasswordError ? (
                      <Text style={modalStyles.errorText}>
                        {loginPasswordError}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={modalStyles.formContainer}>
                    <View style={modalStyles.inputContainer}>
                      <Text style={modalStyles.inputLabel}>昵称</Text>
                      <TextInput
                        ref={registerNameInputRef}
                        style={modalStyles.input}
                        value={registerName}
                        onChangeText={(value) => {
                          setRegisterName(value);
                          setRegisterNameError(
                            value.trim() ? "" : tError("username_required"),
                          );
                        }}
                        placeholder="给自己起个好听的名字吧~"
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoComplete="name"
                        textContentType="name"
                        maxLength={20}
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          registerEmailInputRef.current?.focus()
                        }
                        blurOnSubmit={false}
                      />
                    </View>
                    {registerNameError ? (
                      <Text style={modalStyles.errorText}>
                        {registerNameError}
                      </Text>
                    ) : null}

                    <View style={modalStyles.inputContainer}>
                      <Text style={modalStyles.inputLabel}>邮箱</Text>
                      <TextInput
                        ref={registerEmailInputRef}
                        style={modalStyles.input}
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);
                          setRegisterEmailError(validateEmail(value));
                        }}
                        placeholder="输入你的邮箱地址"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          registerPasswordInputRef.current?.focus()
                        }
                        blurOnSubmit={false}
                      />
                    </View>
                    {registerEmailError ? (
                      <Text style={modalStyles.errorText}>
                        {registerEmailError}
                      </Text>
                    ) : null}

                    <View style={modalStyles.inputContainer}>
                      <Text style={modalStyles.inputLabel}>密码</Text>
                      <TextInput
                        ref={registerPasswordInputRef}
                        style={modalStyles.input}
                        value={password}
                        onChangeText={(value) => {
                          setPassword(value);
                          const error = (() => {
                            if (!value.trim())
                              return tError("password_required");
                            if (value.trim().length < 6)
                              return tError("password_weak");
                            return "";
                          })();
                          setRegisterPasswordError(error);
                          if (confirmPassword) {
                            if (value !== confirmPassword) {
                              setRegisterConfirmPasswordError(
                                tError("confirm_mismatch"),
                              );
                            } else {
                              setRegisterConfirmPasswordError("");
                            }
                          }
                        }}
                        placeholder="设置密码（至少6位）"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password-new"
                        textContentType="newPassword"
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          registerConfirmPasswordInputRef.current?.focus()
                        }
                        blurOnSubmit={false}
                        onFocus={() => {
                          setTimeout(() => {
                            modalScrollViewRef.current?.scrollToEnd({
                              animated: true,
                            });
                          }, 100);
                        }}
                      />
                    </View>
                    {registerPasswordError ? (
                      <Text style={modalStyles.errorText}>
                        {registerPasswordError}
                      </Text>
                    ) : null}

                    <View style={modalStyles.inputContainer}>
                      <Text style={modalStyles.inputLabel}>确认密码</Text>
                      <TextInput
                        ref={registerConfirmPasswordInputRef}
                        style={modalStyles.input}
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          if (!value.trim()) {
                            setRegisterConfirmPasswordError(
                              tError("confirm_required"),
                            );
                          } else if (value !== password) {
                            setRegisterConfirmPasswordError(
                              tError("confirm_mismatch"),
                            );
                          } else {
                            setRegisterConfirmPasswordError("");
                          }
                        }}
                        placeholder="请再次输入密码"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password-new"
                        textContentType="newPassword"
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        onFocus={() => {
                          setTimeout(() => {
                            modalScrollViewRef.current?.scrollToEnd({
                              animated: true,
                            });
                          }, 100);
                        }}
                      />
                    </View>
                    {registerConfirmPasswordError ? (
                      <Text style={modalStyles.errorText}>
                        {registerConfirmPasswordError}
                      </Text>
                    ) : null}
                  </View>
                )}

                {!isRegisterMode && !!loginGlobalError && (
                  <Text style={modalStyles.globalErrorText}>
                    {loginGlobalError}
                  </Text>
                )}
                {isRegisterMode && !!registerGlobalError && (
                  <Animated.View
                    style={{
                      opacity: globalErrorOpacity,
                      transform: [
                        {
                          translateY: globalErrorOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <Text style={modalStyles.globalErrorText}>
                      {registerGlobalError}
                    </Text>
                  </Animated.View>
                )}

                <TouchableOpacity
                  style={modalStyles.primaryButton}
                  onPress={handleLogin}
                  disabled={
                    isLoading ||
                    (!isRegisterMode &&
                      (!!loginEmailError ||
                        !!loginPasswordError ||
                        !email.trim() ||
                        !password.trim())) ||
                    (isRegisterMode &&
                      (!!registerNameError ||
                        !!registerEmailError ||
                        !!registerPasswordError ||
                        !!registerConfirmPasswordError ||
                        !registerName.trim() ||
                        !email.trim() ||
                        !password.trim() ||
                        !confirmPassword.trim()))
                  }
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={modalStyles.primaryButtonText}>
                      {isRegisterMode ? "注册账号" : "登录"}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={modalStyles.switchModeContainer}>
                  <Text style={modalStyles.switchModeText}>
                    {isRegisterMode ? "已有账号？" : "还没有账号？"}
                  </Text>
                  <TouchableOpacity onPress={handleSwitchMode}>
                    <Text style={modalStyles.switchModeLink}>
                      {isRegisterMode ? "立即登录" : "立即注册"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditProfileOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          setIsEditProfileOpen(false);
        }}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={modalStyles.editProfileModalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                modalStyles.editProfileKeyboardView,
                {
                  paddingBottom: isKeyboardVisible
                    ? Math.max(insets.bottom + 20, 40)
                    : Math.max(insets.bottom, 16),
                },
              ]}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
              enabled={Platform.OS === "ios"}
            >
              <View
                style={[
                  modalStyles.modalContent,
                  {
                    maxHeight: Math.min(
                      windowHeight * 0.8,
                      windowHeight -
                        insets.top -
                        Math.max(insets.bottom, 16) -
                        48,
                    ),
                  },
                ]}
              >
                <TouchableOpacity
                  style={modalStyles.closeButton}
                  onPress={() => setIsEditProfileOpen(false)}
                >
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <Text style={modalStyles.modalTitle}>修改资料</Text>

                <View style={modalStyles.avatarSelection}>
                  <Image
                    source={{ uri: editAvatar }}
                    style={modalStyles.previewAvatar}
                    onError={() => {}}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={modalStyles.avatarList}
                  >
                    {AVATARS.map((uri, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setEditAvatar(uri);
                        }}
                        style={[
                          modalStyles.avatarOption,
                          editAvatar === uri && modalStyles.avatarOptionSelected,
                        ]}
                      >
                        <Image
                          source={{ uri }}
                          style={modalStyles.avatarOptionImage}
                          onError={() => {}}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={modalStyles.inputContainer}>
                  <Text style={modalStyles.inputLabel}>昵称</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="给自己起个好听的名字吧"
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveProfile}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity
                  style={modalStyles.primaryButton}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={modalStyles.primaryButtonText}>保存修改</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Companion Days Modal */}
      <CompanionDaysModal
        visible={isCompanionDaysModalOpen}
        onClose={() => setIsCompanionDaysModalOpen(false)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  editProfileModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  editProfileKeyboardView: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlayBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingView: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "stretch",
    overflow: "hidden",
    position: "relative",
  },
  modalScrollView: {
    width: "100%",
    flexShrink: 1,
  },
  modalScrollContent: {
    alignItems: "stretch",
    paddingTop: 0,
    paddingBottom: 16,
    flexGrow: 1,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1000,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
  },
  loginIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  formContainer: {
    width: "100%",
    marginBottom: 24,
    alignItems: "stretch",
  },
  switchModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  switchModeText: {
    fontSize: 14,
    color: "#6B7280",
  },
  switchModeLink: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
    marginLeft: 4,
  },
  avatarSelection: {
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#EF4444",
  },
  avatarList: {
    flexDirection: "row",
    maxHeight: 60,
  },
  avatarOption: {
    marginHorizontal: 6,
    borderRadius: 25,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarOptionSelected: {
    borderColor: "#EF4444",
  },
  avatarOptionImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: -24,
    marginBottom: 24,
  },
  globalErrorText: {
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 12,
  },
});
