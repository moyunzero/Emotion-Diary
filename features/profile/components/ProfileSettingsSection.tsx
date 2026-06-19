/**
 * 设置与数据区：同步入口、恢复、注销、菜单项与登录/注册/编辑资料 Modal
 */

import {
  Archive,
  Check,
  CheckCircle,
  CloudDownload,
  CloudUpload,
  History,
  LogOut,
  Bell,
  User as UserIcon,
  UserX,
  X,
} from "lucide-react-native";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProfileMenuItem,
  ProfileSectionHeader,
} from "@/components/Profile";
import {
  GroupedSettingsCard,
  ScreenFootnote,
} from "@/components/settings";
import { createSettingsStyles } from "@/components/settings/settings.styles";
import { COLORS } from "@/constants/colors";
import type { AppLocale } from "@/i18n/mapDeviceLocale";
import type {
  LocaleMode,
  LocalePreference,
} from "@/services/localeSettings";
import type { EmotionReminderSettings } from "@/services/reminderSettings";
import type { StoreSyncStatus } from "@/store/modules/types";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import {
  AVATAR_PRESETS,
  isSvgAvatarDataUri,
} from "@/utils/avatarPresets";
import { profileScreenModalStyles as ms } from "../styles/profileScreen.styles";

const AVATARS = AVATAR_PRESETS;

export type ProfileSettingsSectionProps = {
  localePreference: LocalePreference;
  effectiveLocale: AppLocale;
  onSetLocale: (locale: AppLocale) => Promise<void>;
  onSetLocaleMode: (mode: LocaleMode) => Promise<void>;
  user: { id: string; name: string; email?: string; avatar?: string } | null;
  syncStatus: "idle" | "syncing" | "success" | "error";
  storeSyncStatus: StoreSyncStatus;
  recycleBinCount: number;
  onOpenRecycleBin: () => void;
  reminderSettings: EmotionReminderSettings;
  reminderLoading: boolean;
  reminderSupported: boolean;
  onToggleDailyReminder: () => void;
  onToggleWeeklyReviewNotification: () => void;
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
    localePreference,
    effectiveLocale,
    onSetLocale,
    onSetLocaleMode,
    user,
    syncStatus,
    storeSyncStatus,
    recycleBinCount,
    onOpenRecycleBin,
    reminderSettings,
    reminderLoading,
    reminderSupported,
    onToggleDailyReminder,
    onToggleWeeklyReviewNotification,
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

  const { t: tProfile } = useTranslation("profile");
  const { t: tSync } = useTranslation("sync");
  const { t: tRetention } = useTranslation("retention");
  const { t: tAuth } = useTranslation("auth");

  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );
  const settingsStyles = useMemo(
    () => createSettingsStyles(width, height),
    [width, height],
  );

  const tError = (key: string): string =>
    tAuth(`errors.${key}`, { defaultValue: key });

  const lastSyncLabel = tSync("status.lastSyncPrefix", {
    time: formatLastSyncTime(lastSyncTime),
  });
  const statusText =
    syncProgress ||
    (storeSyncStatus === "syncing"
      ? tSync("status.syncing")
      : storeSyncStatus === "pending"
        ? tSync("status.pending")
        : storeSyncStatus === "error"
          ? tSync("status.error")
          : lastSyncLabel);

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
      <ProfileSectionHeader title={tProfile("language.sectionTitle")} />
      <GroupedSettingsCard>
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetLocaleMode("system")}
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("language.options.followSystem")}
            </Text>
          </View>
          {localePreference.mode === "system" ? (
            <Check size={20} color="#3B82F6" />
          ) : null}
        </Pressable>
        <View style={profileStyles.menuDivider} />
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetLocale("zh-Hans")}
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("language.options.zhHans")}
            </Text>
          </View>
          {localePreference.mode === "manual" &&
          effectiveLocale === "zh-Hans" ? (
            <Check size={20} color="#3B82F6" />
          ) : null}
        </Pressable>
        <View style={profileStyles.menuDivider} />
        <Pressable
          style={profileStyles.menuItem}
          onPress={() => void onSetLocale("en-US")}
        >
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tProfile("language.options.english")}
            </Text>
          </View>
          {localePreference.mode === "manual" &&
          effectiveLocale === "en-US" ? (
            <Check size={20} color="#3B82F6" />
          ) : null}
        </Pressable>
      </GroupedSettingsCard>

      <ProfileSectionHeader title={tProfile("sections.dataSecurity")} />

      {user ? (
        <ScreenFootnote>{tSync("sectionHint")}</ScreenFootnote>
      ) : null}

      <GroupedSettingsCard
        statusRow={
          user ? (
            <View style={settingsStyles.statusRow}>
              {(syncStatus === "syncing" || storeSyncStatus === "syncing") && (
                <ActivityIndicator
                  size="small"
                  color="#3B82F6"
                  style={settingsStyles.statusIcon}
                />
              )}
              {syncStatus === "success" && storeSyncStatus === "idle" && (
                <CheckCircle
                  size={16}
                  color="#10B981"
                  style={settingsStyles.statusIcon}
                />
              )}
              {(syncStatus === "error" || storeSyncStatus === "error") && (
                <X size={16} color="#EF4444" style={settingsStyles.statusIcon} />
              )}
              <Text style={settingsStyles.statusText}>{statusText}</Text>
            </View>
          ) : undefined
        }
      >
        <ProfileMenuItem
          icon={<CloudUpload size={20} color="#EF4444" />}
          iconBgColor="#FEF2F2"
          title={tSync("uploadTitle")}
          subtext={
            syncStatus === "syncing"
              ? tSync("upload.progress")
              : tSync("uploadSubtext")
          }
          showChevron={syncStatus !== "syncing"}
          disabled={isLoading}
          onPress={onSyncUpload}
        />
        <View style={profileStyles.menuDivider} />
        <ProfileMenuItem
          icon={<CloudDownload size={20} color="#3B82F6" />}
          iconBgColor="#EFF6FF"
          title={tSync("pullTitle")}
          subtext={
            syncStatus === "syncing"
              ? tSync("pull.progress")
              : tSync("pullSubtext")
          }
          showChevron={syncStatus !== "syncing"}
          disabled={isLoading}
          onPress={onSyncDownload}
        />
        <View style={profileStyles.menuDivider} />
        <ProfileMenuItem
          testID="profile-recycle-bin-item"
          icon={<Archive size={20} color="#6B7280" />}
          iconBgColor={COLORS.gray[50]}
          title={tProfile("recycleBin.title")}
          subtext={
            recycleBinCount > 0
              ? tProfile("recycleBin.subtextCount", { count: recycleBinCount })
              : tProfile("recycleBin.subtextEmpty")
          }
          showChevron={true}
          disabled={isLoading}
          onPress={onOpenRecycleBin}
        />
      </GroupedSettingsCard>

      <ProfileSectionHeader title={tProfile("sections.retention")} />
      <GroupedSettingsCard>
        <View style={profileStyles.menuItem}>
          <View
            style={[
              profileStyles.menuIcon,
              { backgroundColor: "#FEF2F2" },
            ]}
          >
            <Bell size={20} color="#EF4444" />
          </View>
          <View style={profileStyles.menuTextContainer}>
            <Text style={profileStyles.menuText}>
              {tRetention("dailyReminder.title")}
            </Text>
            <Text style={profileStyles.menuSubtext}>
              {reminderSupported
                ? reminderSettings.dailyReminderEnabled
                  ? tRetention("dailyReminder.subtextEnabled", {
                      hour: String(reminderSettings.dailyReminderHour).padStart(
                        2,
                        "0",
                      ),
                      minute: String(
                        reminderSettings.dailyReminderMinute,
                      ).padStart(2, "0"),
                    })
                  : tRetention("dailyReminder.subtextDisabled")
                : tRetention("webReminderUnsupported")}
            </Text>
          </View>
          {reminderSupported ? (
            <Switch
              value={reminderSettings.dailyReminderEnabled}
              onValueChange={() => onToggleDailyReminder()}
              disabled={isLoading || reminderLoading}
              trackColor={{ false: COLORS.gray[200], true: "#FECACA" }}
              thumbColor={
                reminderSettings.dailyReminderEnabled ? "#EF4444" : "#f4f3f4"
              }
            />
          ) : null}
        </View>
        {reminderSupported && reminderSettings.dailyReminderEnabled ? (
          <>
            <View style={profileStyles.menuDivider} />
            <View style={profileStyles.menuItem}>
              <View
                style={[
                  profileStyles.menuIcon,
                  { backgroundColor: "#EFF6FF" },
                ]}
              >
                <History size={20} color="#3B82F6" />
              </View>
              <View style={profileStyles.menuTextContainer}>
                <Text style={profileStyles.menuText}>
                  {tRetention("weeklyReview.toggleTitle")}
                </Text>
                <Text style={profileStyles.menuSubtext}>
                  {tRetention("weeklyReview.toggleSubtext")}
                </Text>
              </View>
              <Switch
                value={reminderSettings.weeklyReviewNotificationEnabled}
                onValueChange={() => onToggleWeeklyReviewNotification()}
                disabled={isLoading || reminderLoading}
                trackColor={{ false: COLORS.gray[200], true: "#BFDBFE" }}
                thumbColor={
                  reminderSettings.weeklyReviewNotificationEnabled
                    ? "#3B82F6"
                    : "#f4f3f4"
                }
              />
            </View>
          </>
        ) : null}
      </GroupedSettingsCard>

      {user && (
        <>
          <ProfileSectionHeader title={tProfile("sections.account")} />
          <GroupedSettingsCard>
            <ProfileMenuItem
              icon={<LogOut size={20} color="#EF4444" />}
              iconBgColor="#FEF2F2"
              title={tProfile("account.logout")}
              showChevron={false}
              danger
              onPress={onLogout}
            />
            <View style={profileStyles.menuDivider} />
            <ProfileMenuItem
              icon={<UserX size={20} color="#EF4444" />}
              iconBgColor="#FEF2F2"
              title={tProfile("account.deleteAccount")}
              subtext={tProfile("account.deleteAccountSubtext")}
              showChevron={false}
              danger
              onPress={onDeleteAccount}
            />
          </GroupedSettingsCard>
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
        <View
          style={[
            ms.modalOverlay,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={ms.modalOverlayBackground} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={ms.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
          >
            <View
              style={[
                ms.modalContent,
                {
                  maxHeight: Math.min(
                    height * 0.75,
                    height -
                      Math.max(insets.top, 12) -
                      Math.max(insets.bottom, 12) -
                      48,
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
                    {isRegisterMode
                      ? tAuth("register.modalTitle")
                      : tAuth("login.modalTitle")}
                  </Text>
                  <Text style={ms.modalSubtitle}>
                    {isRegisterMode
                      ? tAuth("register.modalSubtitle")
                      : tAuth("login.modalSubtitle")}
                  </Text>
                </View>

                {!isRegisterMode ? (
                  <View style={ms.formContainer} key="login-form">
                    <View style={ms.inputContainer}>
                      <Text style={ms.inputLabel}>{tAuth("login.emailLabel")}</Text>
                      <TextInput
                        key="login-email-input"
                        ref={emailInputRef}
                        style={ms.input}
                        value={email}
                        onChangeText={(v) => {
                          setEmail(v);
                          setLoginEmailError(validateEmail(v));
                        }}
                        placeholder={tAuth("login.emailPlaceholder")}
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
                      <Text style={ms.inputLabel}>{tAuth("login.passwordLabel")}</Text>
                      <TextInput
                        style={ms.input}
                        value={password}
                        onChangeText={(v) => {
                          setPassword(v);
                          setLoginPasswordError(validatePassword(v, false));
                        }}
                        placeholder={tAuth("login.passwordPlaceholder")}
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
                      <Text style={ms.inputLabel}>{tAuth("register.nameLabel")}</Text>
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
                        placeholder={tAuth("register.namePlaceholder")}
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
                      <Text style={ms.inputLabel}>{tAuth("login.emailLabel")}</Text>
                      <TextInput
                        ref={registerEmailInputRef}
                        style={ms.input}
                        value={email}
                        onChangeText={(v) => {
                          setEmail(v);
                          setRegisterEmailError(validateEmail(v));
                        }}
                        placeholder={tAuth("login.emailPlaceholder")}
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
                      <Text style={ms.inputLabel}>{tAuth("register.passwordLabel")}</Text>
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
                        placeholder={tAuth("register.passwordPlaceholder")}
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
                      <Text style={ms.inputLabel}>
                        {tAuth("register.confirmPasswordLabel")}
                      </Text>
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
                        placeholder={tAuth("register.confirmPasswordPlaceholder")}
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
                      {isRegisterMode
                        ? tAuth("register.submit")
                        : tAuth("login.submit")}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={ms.switchModeContainer}>
                  <Text style={ms.switchModeText}>
                    {isRegisterMode
                      ? tAuth("register.switchPrompt")
                      : tAuth("login.switchPrompt")}
                  </Text>
                  <TouchableOpacity onPress={onSwitchMode}>
                    <Text style={ms.switchModeLink}>
                      {isRegisterMode
                        ? tAuth("register.switchLink")
                        : tAuth("login.switchLink")}
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
                      height * 0.8,
                      height -
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

                <Text style={ms.modalTitle}>{tAuth("editProfile.modalTitle")}</Text>

                <View style={ms.avatarSelection}>
                  <Image
                    source={{ uri: editAvatar }}
                    style={ms.previewAvatar}
                    contentFit={
                      isSvgAvatarDataUri(editAvatar) ? "contain" : "cover"
                    }
                    contentPosition="center"
                    cachePolicy="memory-disk"
                    transition={150}
                    onError={() => {}}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={ms.avatarList}
                  >
                    {AVATARS.map((uri) => (
                      <TouchableOpacity
                        key={uri}
                        onPress={() => setEditAvatar(uri)}
                        style={[
                          ms.avatarOption,
                          editAvatar === uri && ms.avatarOptionSelected,
                        ]}
                      >
                        <Image
                          source={{ uri }}
                          style={ms.avatarOptionImage}
                          contentFit={
                            isSvgAvatarDataUri(uri) ? "contain" : "cover"
                          }
                          contentPosition="center"
                          cachePolicy="memory-disk"
                          transition={150}
                          onError={() => {}}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={ms.inputContainer}>
                  <Text style={ms.inputLabel}>{tAuth("editProfile.nameLabel")}</Text>
                  <TextInput
                    style={ms.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={tAuth("editProfile.namePlaceholder")}
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
                    <Text style={ms.primaryButtonText}>
                      {tAuth("editProfile.save")}
                    </Text>
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
