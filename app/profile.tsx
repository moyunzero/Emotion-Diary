import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
    Camera,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CloudDownload,
    CloudUpload,
    LogOut,
    User as UserIcon,
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Avatar from "../components/Avatar";
import CompanionDaysCard from "../components/CompanionDaysCard";
import CompanionDaysModal from "../components/CompanionDaysModal";
import { Toast } from "../components/Toast";
import { useAppStore } from "../store/useAppStore";

const { width, height: windowHeight } = Dimensions.get("window");

const AVATARS = [
  "https://picsum.photos/id/64/200/200",
  "https://picsum.photos/id/177/200/200",
  "https://picsum.photos/id/237/200/200",
  "https://picsum.photos/id/433/200/200",
  "https://picsum.photos/id/1025/200/200",
  "https://picsum.photos/id/1074/200/200",
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((state) => state.user);
  const entries = useAppStore((state) => state.entries);
  const weather = useAppStore((state) => state.weather);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const updateUser = useAppStore((state) => state.updateUser);
  const syncToCloud = useAppStore((state) => state.syncToCloud);
  const register = useAppStore((state) => state.register);
  const recoverFromCloud = useAppStore((state) => state.recoverFromCloud);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isCompanionDaysModalOpen, setIsCompanionDaysModalOpen] = useState(false);

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
      } catch (error) {
        console.error("加载最后同步时间失败:", error);
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
      // 当切换到登录模式时，延迟聚焦输入框
      // 使用更长的延迟确保组件完全渲染
      const timer = setTimeout(
        () => {
          if (emailInputRef.current) {
            emailInputRef.current.focus();
            console.log("Attempting to focus email input after mode switch");
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

    // 防止重复点击
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
        // 重新获取最新的 entries 状态
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
        // 重新获取最新的 entries 状态
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

  /**
   * 处理登录/注册模式切换
   * 切换时自动关闭键盘、重置滚动位置、清空所有表单字段
   * 添加保护机制防止Android平台在切换时误触发Modal关闭
   */
  const handleSwitchMode = () => {
    // 设置保护标志，防止在切换模式时触发Modal关闭（Android平台问题）
    isSwitchingModeRef.current = true;

    // 关闭键盘
    // Keyboard.dismiss();

    // 重置滚动位置到顶部
    modalScrollViewRef.current?.scrollTo({ y: 0, animated: true });

    // 切换模式
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

    // 如果切换到登录模式，延迟聚焦邮箱输入框
    if (newMode === false) {
      setTimeout(
        () => {
          emailInputRef.current?.focus();
        },
        Platform.OS === "android" ? 500 : 250,
      );
    }

    // 延迟清除保护标志，确保状态更新完成后再允许关闭Modal
    // Android平台需要更长的延迟来确保Modal正确识别状态变化
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

  // 错误提示文本映射（纯中文）
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
            // 清空所有输入和错误信息
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
          // 清空所有输入和错误信息
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
    setEditAvatar(user.avatar || AVATARS[0]);
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

  return (
    <View style={styles.container}>
      {/* Decorative Background Circle */}
      <View style={styles.bgCircle} />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={28} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerActions} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={user ? openEditProfile : () => setIsLoginModalOpen(true)}
              style={styles.avatarWrapper}
            >
              <Avatar
                uri={user?.avatar}
                name={user?.name}
                size={88}
                style={styles.avatar}
              />
              {user && (
                <View style={styles.editBadge}>
                  <Camera size={14} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.userInfo}>
              {user ? (
                <>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userHandle}>
                    {user.email || `@user_${user.id.slice(0, 8)}`}
                  </Text>
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodText}>
                      今日心情: {weather.score > 20 ? "🌧️" : "☀️"}
                    </Text>
                  </View>
                </>
              ) : (
                <TouchableOpacity onPress={() => setIsLoginModalOpen(true)}>
                  <Text style={styles.loginTitle}>点击登录</Text>
                  <Text style={styles.loginSubtitle}>开启您的情绪之旅</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>心事记录</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#EF4444" }]}>
                {weather.score}
              </Text>
              <Text style={styles.statLabel}>心情指数</Text>
            </View>
            <CompanionDaysCard onPress={() => setIsCompanionDaysModalOpen(true)} />
          </View>

          {/* Menu Groups */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuHeader}>数据与安全</Text>

            {/* 同步状态指示器 */}
            {user && (
              <View style={styles.syncStatusContainer}>
                <View style={styles.syncStatusRow}>
                  <View style={styles.syncStatusLeft}>
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
                    <Text style={styles.syncStatusText}>
                      {syncProgress ||
                        `最后同步：${formatLastSyncTime(lastSyncTime)}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={[styles.menuItem, isLoading && styles.menuItemDisabled]}
                onPress={() => handleSyncAction("upload")}
                disabled={isLoading}
              >
                <View style={[styles.menuIcon, { backgroundColor: "#FEF2F2" }]}>
                  <CloudUpload size={20} color="#EF4444" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>备份心事</Text>
                  {syncStatus === "syncing" && (
                    <Text style={styles.menuSubtext}>正在备份...</Text>
                  )}
                </View>
                {syncStatus !== "syncing" && (
                  <ChevronRight size={20} color="#D1D5DB" />
                )}
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={[styles.menuItem, isLoading && styles.menuItemDisabled]}
                onPress={() => handleSyncAction("download")}
                disabled={isLoading}
              >
                <View style={[styles.menuIcon, { backgroundColor: "#EFF6FF" }]}>
                  <CloudDownload size={20} color="#3B82F6" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuText}>找回回忆</Text>
                  {syncStatus === "syncing" && (
                    <Text style={styles.menuSubtext}>正在同步...</Text>
                  )}
                </View>
                {syncStatus !== "syncing" && (
                  <ChevronRight size={20} color="#D1D5DB" />
                )}
              </TouchableOpacity>
            </View>

            {user && (
              <>
                <Text style={styles.menuHeader}>其他</Text>
                <View style={styles.menuGroup}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleLogout}
                  >
                    <View
                      style={[styles.menuIcon, { backgroundColor: "#FEF2F2" }]}
                    >
                      <LogOut size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.menuText, { color: "#EF4444" }]}>
                      退出登录
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      )}

      {/* Login Modal */}
      <Modal
        visible={isLoginModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          // Android平台：如果正在切换模式，忽略关闭请求，防止弹窗反复出现
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
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlayBackground} />
          </TouchableWithoutFeedback>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <View
              style={[
                styles.modalContent,
                {
                  marginTop: insets.top + 20, // 确保不进入安全区域
                  marginBottom: Math.max(insets.bottom, 20), // 底部安全区域
                  maxHeight: Math.min(
                    windowHeight * 0.75,
                      windowHeight - insets.top - Math.max(insets.bottom, 20) - 40,
                    ),
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.closeButton}
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
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  keyboardDismissMode={
                    Platform.OS === "ios" ? "interactive" : "on-drag"
                  }
                >
                  <View style={styles.modalHeader}>
                    <View style={styles.loginIconBox}>
                      <UserIcon size={32} color="#EF4444" />
                    </View>
                    <Text style={styles.modalTitle}>
                      {isRegisterMode ? "创建账号" : "开启云端守护"}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {isRegisterMode
                        ? "注册账号，让情绪记录永久保存"
                        : "登录后，您的情绪记录将安全地存储在云端，随时随地找回。"}
                    </Text>
                  </View>

                  {!isRegisterMode ? (
                    // 登录表单
                    <View style={styles.formContainer} key="login-form">
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>邮箱</Text>
                        <TextInput
                          key="login-email-input"
                          ref={emailInputRef}
                          style={styles.input}
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
                            // 查找密码输入框并聚焦
                            const passwordInputs = modalScrollViewRef.current;
                            if (passwordInputs) {
                              // 在登录模式下，直接跳到密码输入框
                              setTimeout(() => {
                                modalScrollViewRef.current?.scrollToEnd({
                                  animated: true,
                                });
                              }, 100);
                            }
                          }}
                          blurOnSubmit={false}
                          onFocus={() => {
                            // 确保输入框获得焦点时可以正常输入
                            console.log("Email input focused");
                          }}
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>密码</Text>
                        <TextInput
                          style={styles.input}
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
                        <Text style={styles.errorText}>{loginEmailError}</Text>
                      ) : null}
                      {loginPasswordError ? (
                        <Text style={styles.errorText}>
                          {loginPasswordError}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    // 注册表单
                    <View style={styles.formContainer}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>昵称</Text>
                        <TextInput
                          ref={registerNameInputRef}
                          style={styles.input}
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
                          onSubmitEditing={() => registerEmailInputRef.current?.focus()}
                          blurOnSubmit={false}
                        />
                      </View>
                      {registerNameError ? (
                        <Text style={styles.errorText}>
                          {registerNameError}
                        </Text>
                      ) : null}

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>邮箱</Text>
                        <TextInput
                          ref={registerEmailInputRef}
                          style={styles.input}
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
                          onSubmitEditing={() => registerPasswordInputRef.current?.focus()}
                          blurOnSubmit={false}
                        />
                      </View>
                      {registerEmailError ? (
                        <Text style={styles.errorText}>
                          {registerEmailError}
                        </Text>
                      ) : null}

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>密码</Text>
                        <TextInput
                          ref={registerPasswordInputRef}
                          style={styles.input}
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
                          onSubmitEditing={() => registerConfirmPasswordInputRef.current?.focus()}
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
                        <Text style={styles.errorText}>
                          {registerPasswordError}
                        </Text>
                      ) : null}

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>确认密码</Text>
                        <TextInput
                          ref={registerConfirmPasswordInputRef}
                          style={styles.input}
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
                        <Text style={styles.errorText}>
                          {registerConfirmPasswordError}
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {!isRegisterMode && !!loginGlobalError && (
                    <Text style={styles.globalErrorText}>
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
                      <Text style={styles.globalErrorText}>
                        {registerGlobalError}
                      </Text>
                    </Animated.View>
                  )}

                  <TouchableOpacity
                    style={styles.primaryButton}
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
                      <Text style={styles.primaryButtonText}>
                        {isRegisterMode ? "注册账号" : "登录"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.switchModeContainer}>
                    <Text style={styles.switchModeText}>
                      {isRegisterMode ? "已有账号？" : "还没有账号？"}
                    </Text>
                    <TouchableOpacity onPress={handleSwitchMode}>
                      <Text style={styles.switchModeLink}>
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
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setIsEditProfileOpen(false);
        }}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SafeAreaView style={styles.modalOverlay} edges={["top"]}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                styles.keyboardAvoidingView,
                { 
                  paddingBottom: isKeyboardVisible 
                    ? Math.max(insets.bottom + 20, 40)  // 键盘显示时：确保有足够空间
                    : Math.max(insets.bottom, 16)       // 键盘隐藏时：最小间距
                },
              ]}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
              enabled={Platform.OS === "ios"}
            >
            <View
              style={[
                styles.modalContent,
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
                style={styles.closeButton}
                onPress={() => setIsEditProfileOpen(false)}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>修改资料</Text>

              <View style={styles.avatarSelection}>
                <Image
                  source={{ uri: editAvatar }}
                  style={styles.previewAvatar}
                  onError={() => {
                    // 头像加载失败，使用默认头像
                  }}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.avatarList}
                >
                  {AVATARS.map((uri, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setEditAvatar(uri);
                      }}
                      style={[
                        styles.avatarOption,
                        editAvatar === uri && styles.avatarOptionSelected,
                      ]}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.avatarOptionImage}
                        onError={() => {
                          // 头像选项加载失败
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>昵称</Text>
                <TextInput
                  style={styles.input}
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
                style={styles.primaryButton}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>保存修改</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F5", // 浅粉色背景
  },
  bgCircle: {
    position: "absolute",
    top: -width * 0.5,
    left: -width * 0.2,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: "#FEF2F2", // 更浅的粉色
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileSection: {
    marginTop: 20,
    marginBottom: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#EF4444",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
    fontFamily: "Lato_700Bold",
  },
  userHandle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontFamily: "Lato_400Regular",
  },
  moodBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  moodText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
    fontFamily: "Lato_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Lato_400Regular",
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  menuSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  syncStatusContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  syncStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  syncStatusText: {
    fontSize: 12,
    color: "#6B7280",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 68,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
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
    zIndex: 1000, // 确保按钮在最上层
    backgroundColor: "rgba(255, 255, 255, 0.9)", // 添加背景色提高可见性
    borderRadius: 20, // 圆角
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // Android 阴影
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%", // 确保宽度填充
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
    alignItems: "stretch", // 确保表单内容可以填充宽度
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
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  // Edit Profile Specific
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
