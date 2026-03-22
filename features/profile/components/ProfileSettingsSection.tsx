/**
 * 设置与数据区：同步入口、恢复、注销、菜单项与登录/注册/编辑资料 Modal
 */

import {
  CheckCircle,
  CloudDownload,
  CloudUpload,
  LogOut,
  User as UserIcon,
  UserX,
  X,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProfileMenuItem,
  ProfileSectionHeader,
} from "@/components/Profile";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import { AVATAR_PRESETS } from "@/utils/avatarPresets";
import { profileScreenModalStyles as ms } from "../styles/profileScreen.styles";

const { height: windowHeight } = Dimensions.get("window");
const AVATARS = AVATAR_PRESETS;

export type ProfileSettingsSectionProps = {
  user: { id: string; name: string; email?: string; avatar?: string } | null;
  syncStatus: "idle" | "syncing" | "success" | "error";
  syncProgress: string;
  lastSyncTime: number | null;
  formatLastSyncTime: (ts: number | null) => string;
  isLoading: boolean;
  onSyncUpload: () => void;
  onSyncDownload: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isLoginModalOpen: boolean;
  onCloseLoginModal: () => void;
  isEditProfileOpen: boolean;
  onCloseEditProfileModal: () => void;
  isRegisterMode: boolean;
  onSwitchMode: () => void;
  onLogin: () => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  registerName: string;
  setRegisterName: (v: string) => void;
  loginEmailError: string;
  setLoginEmailError: (v: string) => void;
  loginPasswordError: string;
  setLoginPasswordError: (v: string) => void;
  registerNameError: string;
  setRegisterNameError: (v: string) => void;
  registerEmailError: string;
  setRegisterEmailError: (v: string) => void;
  registerPasswordError: string;
  setRegisterPasswordError: (v: string) => void;
  registerConfirmPasswordError: string;
  setRegisterConfirmPasswordError: (v: string) => void;
  loginGlobalError: string;
  registerGlobalError: string;
  modalScrollViewRef: React.RefObject<ScrollView | null>;
  emailInputRef: React.RefObject<TextInput | null>;
  registerNameInputRef: React.RefObject<TextInput | null>;
  registerEmailInputRef: React.RefObject<TextInput | null>;
  registerPasswordInputRef: React.RefObject<TextInput | null>;
  registerConfirmPasswordInputRef: React.RefObject<TextInput | null>;
  isSwitchingModeRef: React.MutableRefObject<boolean>;
  validateEmail: (v: string) => string;
  validatePassword: (v: string, isReg: boolean) => string;
  editName: string;
  setEditName: (v: string) => void;
  editAvatar: string;
  setEditAvatar: (v: string) => void;
  isKeyboardVisible: boolean;
  onSaveProfile: () => void;
  globalErrorOpacity: Animated.Value;
};

export function ProfileSettingsSection(props: ProfileSettingsSectionProps) {
  const insets = useSafeAreaInsets();
  const {
    user,
    syncStatus,
    syncProgress,
    lastSyncTime,
    formatLastSyncTime,
    isLoading,
    onSyncUpload,
    onSyncDownload,
    onLogout,
    onDeleteAccount,
    isLoginModalOpen,
    onCloseLoginModal,
    isEditProfileOpen,
    onCloseEditProfileModal,
    isRegisterMode,
    onSwitchMode,
    onLogin,
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
    registerGlobalError,
    modalScrollViewRef,
    emailInputRef,
    registerNameInputRef,
    registerEmailInputRef,
    registerPasswordInputRef,
    registerConfirmPasswordInputRef,
    isSwitchingModeRef,
    validateEmail,
    validatePassword,
    editName,
    setEditName,
    editAvatar,
    setEditAvatar,
    isKeyboardVisible,
    onSaveProfile,
    globalErrorOpacity,
  } = props;

  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );

  const tError = (key: string): string => {
    const map: Record<string, string> = {
      username_required: "昵称不能为空，请输入 2-20 个字符",
      email_required: "邮箱不能为空，请输入有效的邮箱地址",
      email_invalid: "邮箱格式不正确，请检查后重新输入",
      password_required: "密码不能为空",
      password_weak: "密码需为 6-20 位，包含字母和数字",
      confirm_required: "请再次输入密码进行确认",
      confirm_mismatch: "两次输入的密码不一致，请重新确认",
    };
    return map[key] || key;
  };

  const closeLoginAndReset = () => {
    Keyboard.dismiss();
    onCloseLoginModal();
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
  };

  return (
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
          onPress={onSyncUpload}
        />
        <View style={profileStyles.menuDivider} />
        <ProfileMenuItem
          icon={<CloudDownload size={20} color="#3B82F6" />}
          iconBgColor="#EFF6FF"
          title="找回回忆"
          subtext={syncStatus === "syncing" ? "正在同步..." : undefined}
          showChevron={syncStatus !== "syncing"}
          disabled={isLoading}
          onPress={onSyncDownload}
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
              onPress={onLogout}
            />
            <View style={profileStyles.menuDivider} />
            <ProfileMenuItem
              icon={<UserX size={20} color="#EF4444" />}
              iconBgColor="#FEF2F2"
              title="注销账号"
              subtext="永久删除云端账号及数据，本地记录保留"
              showChevron={false}
              danger
              onPress={onDeleteAccount}
            />
          </View>
        </>
      )}

      {/* Login Modal */}
      <Modal
        visible={isLoginModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (Platform.OS === "android" && isSwitchingModeRef.current) return;
          closeLoginAndReset();
        }}
        statusBarTranslucent
      >
        <View style={ms.modalOverlay}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={ms.modalOverlayBackground} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={ms.keyboardAvoidingView}
            keyboardVerticalOffset={0}
          >
            <View
              style={[
                ms.modalContent,
                {
                  marginTop: insets.top + 20,
                  marginBottom: Math.max(insets.bottom, 20),
                  maxHeight: Math.min(
                    windowHeight * 0.75,
                    windowHeight - insets.top - Math.max(insets.bottom, 20) - 40,
                  ),
                },
              ]}
            >
              <TouchableOpacity
                style={ms.closeButton}
                onPress={() => {
                  onCloseLoginModal();
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
                }}
              >
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>

              <ScrollView
                ref={modalScrollViewRef}
                style={ms.modalScrollView}
                contentContainerStyle={ms.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
              >
                <View style={ms.modalHeader}>
                  <View style={ms.loginIconBox}>
                    <UserIcon size={32} color="#EF4444" />
                  </View>
                  <Text style={ms.modalTitle}>
                    {isRegisterMode ? "创建账号" : "开启云端守护"}
                  </Text>
                  <Text style={ms.modalSubtitle}>
                    {isRegisterMode
                      ? "注册账号，让情绪记录永久保存"
                      : "登录后，您的情绪记录将安全地存储在云端，随时随地找回。"}
                  </Text>
                </View>

                {!isRegisterMode ? (
                  <View style={ms.formContainer} key="login-form">
                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>邮箱</Text>
                      <TextInput
                        key="login-email-input"
                        ref={emailInputRef}
                        style={ms.input}
                        value={email}
                        onChangeText={(v) => {
                          setEmail(v);
                          setLoginEmailError(validateEmail(v));
                        }}
                        placeholder="输入你的邮箱地址"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        textContentType="emailAddress"
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          setTimeout(
                            () =>
                              modalScrollViewRef.current?.scrollToEnd({
                                animated: true,
                              }),
                            100,
                          )
                        }
                        blurOnSubmit={false}
                      />
                    </View>
                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>密码</Text>
                      <TextInput
                        style={ms.input}
                        value={password}
                        onChangeText={(v) => {
                          setPassword(v);
                          setLoginPasswordError(validatePassword(v, false));
                        }}
                        placeholder="输入你的密码"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        returnKeyType="done"
                        onSubmitEditing={onLogin}
                        onFocus={() =>
                          setTimeout(
                            () =>
                              modalScrollViewRef.current?.scrollToEnd({
                                animated: true,
                              }),
                            100,
                          )
                        }
                      />
                    </View>
                    {loginEmailError ? (
                      <Text style={ms.errorText}>{loginEmailError}</Text>
                    ) : null}
                    {loginPasswordError ? (
                      <Text style={ms.errorText}>{loginPasswordError}</Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={ms.formContainer}>
                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>昵称</Text>
                      <TextInput
                        ref={registerNameInputRef}
                        style={ms.input}
                        value={registerName}
                        onChangeText={(v) => {
                          setRegisterName(v);
                          setRegisterNameError(
                            v.trim() ? "" : tError("username_required"),
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
                      <Text style={ms.errorText}>{registerNameError}</Text>
                    ) : null}

                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>邮箱</Text>
                      <TextInput
                        ref={registerEmailInputRef}
                        style={ms.input}
                        value={email}
                        onChangeText={(v) => {
                          setEmail(v);
                          setRegisterEmailError(validateEmail(v));
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
                      <Text style={ms.errorText}>{registerEmailError}</Text>
                    ) : null}

                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>密码</Text>
                      <TextInput
                        ref={registerPasswordInputRef}
                        style={ms.input}
                        value={password}
                        onChangeText={(v) => {
                          setPassword(v);
                          const err = !v.trim()
                            ? tError("password_required")
                            : v.trim().length < 6
                              ? tError("password_weak")
                              : "";
                          setRegisterPasswordError(err);
                          if (confirmPassword) {
                            setRegisterConfirmPasswordError(
                              v !== confirmPassword
                                ? tError("confirm_mismatch")
                                : "",
                            );
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
                        onFocus={() =>
                          setTimeout(
                            () =>
                              modalScrollViewRef.current?.scrollToEnd({
                                animated: true,
                              }),
                            100,
                          )
                        }
                      />
                    </View>
                    {registerPasswordError ? (
                      <Text style={ms.errorText}>{registerPasswordError}</Text>
                    ) : null}

                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>确认密码</Text>
                      <TextInput
                        ref={registerConfirmPasswordInputRef}
                        style={ms.input}
                        value={confirmPassword}
                        onChangeText={(v) => {
                          setConfirmPassword(v);
                          if (!v.trim())
                            setRegisterConfirmPasswordError(
                              tError("confirm_required"),
                            );
                          else if (v !== password)
                            setRegisterConfirmPasswordError(
                              tError("confirm_mismatch"),
                            );
                          else setRegisterConfirmPasswordError("");
                        }}
                        placeholder="请再次输入密码"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password-new"
                        textContentType="newPassword"
                        returnKeyType="done"
                        onSubmitEditing={onLogin}
                        onFocus={() =>
                          setTimeout(
                            () =>
                              modalScrollViewRef.current?.scrollToEnd({
                                animated: true,
                              }),
                            100,
                          )
                        }
                      />
                    </View>
                    {registerConfirmPasswordError ? (
                      <Text style={ms.errorText}>
                        {registerConfirmPasswordError}
                      </Text>
                    ) : null}
                  </View>
                )}

                {!isRegisterMode && !!loginGlobalError && (
                  <Text style={ms.globalErrorText}>{loginGlobalError}</Text>
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
                    <Text style={ms.globalErrorText}>
                      {registerGlobalError}
                    </Text>
                  </Animated.View>
                )}

                <TouchableOpacity
                  style={ms.primaryButton}
                  onPress={onLogin}
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
                    <Text style={ms.primaryButtonText}>
                      {isRegisterMode ? "注册账号" : "登录"}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={ms.switchModeContainer}>
                  <Text style={ms.switchModeText}>
                    {isRegisterMode ? "已有账号？" : "还没有账号？"}
                  </Text>
                  <TouchableOpacity onPress={onSwitchMode}>
                    <Text style={ms.switchModeLink}>
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
        transparent
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          onCloseEditProfileModal();
        }}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={ms.editProfileModalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                ms.editProfileKeyboardView,
                {
                  paddingBottom: isKeyboardVisible
                    ? Math.max(insets.bottom + 20, 40)
                    : Math.max(insets.bottom, 16),
                },
              ]}
              keyboardVerticalOffset={0}
              enabled={Platform.OS === "ios"}
            >
              <View
                style={[
                  ms.modalContent,
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
                  style={ms.closeButton}
                  onPress={onCloseEditProfileModal}
                >
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>

                <Text style={ms.modalTitle}>修改资料</Text>

                <View style={ms.avatarSelection}>
                  <Image
                    source={{ uri: editAvatar }}
                    style={ms.previewAvatar}
                    onError={() => {}}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={ms.avatarList}
                  >
                    {AVATARS.map((uri, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setEditAvatar(uri)}
                        style={[
                          ms.avatarOption,
                          editAvatar === uri && ms.avatarOptionSelected,
                        ]}
                      >
                        <Image
                          source={{ uri }}
                          style={ms.avatarOptionImage}
                          onError={() => {}}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={ms.inputContainer}>
                  <Text style={ms.inputLabel}>昵称</Text>
                  <TextInput
                    style={ms.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="给自己起个好听的名字吧"
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={onSaveProfile}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity
                  style={ms.primaryButton}
                  onPress={onSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={ms.primaryButtonText}>保存修改</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
