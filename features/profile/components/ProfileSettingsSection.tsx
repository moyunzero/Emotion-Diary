/**
 * 设置与数据区：同步入口、恢复、注销、菜单项与登录/注册/编辑资料 Modal
 */

import { Animated, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import type { AppLocale } from "@/i18n/mapDeviceLocale";
import type {
  LocaleMode,
  LocalePreference,
} from "@/services/localeSettings";
import type { EmotionReminderSettings } from "@/services/reminderSettings";
import type { StoreSyncStatus } from "@/store/modules/types";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import { ProfileAccountSection } from "./ProfileAccountSection";
import { ProfileAuthModals } from "./ProfileAuthModals";
import { ProfileDataSecuritySection } from "./ProfileDataSecuritySection";
import { ProfileLanguageSection } from "./ProfileLanguageSection";
import { ProfileRetentionSection } from "./ProfileRetentionSection";

export type ProfileSettingsSectionProps = {
  localePreference: LocalePreference;
  effectiveLocale: AppLocale;
  onSetLocale: (locale: AppLocale) => Promise<void>;
  onSetLocaleMode: (mode: LocaleMode) => Promise<void>;
  user: { id: string; name: string; email?: string; avatar?: string } | null;
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
  const {
    localePreference,
    effectiveLocale,
    onSetLocale,
    onSetLocaleMode,
    user,
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

  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );

  return (
    <View style={profileStyles.menuContainer}>
      <ProfileLanguageSection
        localePreference={localePreference}
        effectiveLocale={effectiveLocale}
        onSetLocale={onSetLocale}
        onSetLocaleMode={onSetLocaleMode}
      />

      <ProfileDataSecuritySection
        user={user}
        storeSyncStatus={storeSyncStatus}
        recycleBinCount={recycleBinCount}
        onOpenRecycleBin={onOpenRecycleBin}
        syncProgress={syncProgress}
        lastSyncTime={lastSyncTime}
        formatLastSyncTime={formatLastSyncTime}
        isLoading={isLoading}
        onSyncUpload={onSyncUpload}
        onSyncDownload={onSyncDownload}
      />

      <ProfileRetentionSection
        reminderSettings={reminderSettings}
        reminderLoading={reminderLoading}
        reminderSupported={reminderSupported}
        onToggleDailyReminder={onToggleDailyReminder}
        onToggleWeeklyReviewNotification={onToggleWeeklyReviewNotification}
        isLoading={isLoading}
      />

      {user ? (
        <ProfileAccountSection
          onLogout={onLogout}
          onDeleteAccount={onDeleteAccount}
          isEditProfileOpen={isEditProfileOpen}
          onCloseEditProfileModal={onCloseEditProfileModal}
          editName={editName}
          setEditName={setEditName}
          editAvatar={editAvatar}
          setEditAvatar={setEditAvatar}
          isKeyboardVisible={isKeyboardVisible}
          onSaveProfile={onSaveProfile}
          isLoading={isLoading}
        />
      ) : null}

      <ProfileAuthModals
        isLoginModalOpen={isLoginModalOpen}
        onCloseLoginModal={onCloseLoginModal}
        isRegisterMode={isRegisterMode}
        onSwitchMode={onSwitchMode}
        onLogin={onLogin}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        registerName={registerName}
        setRegisterName={setRegisterName}
        loginEmailError={loginEmailError}
        setLoginEmailError={setLoginEmailError}
        loginPasswordError={loginPasswordError}
        setLoginPasswordError={setLoginPasswordError}
        registerNameError={registerNameError}
        setRegisterNameError={setRegisterNameError}
        registerEmailError={registerEmailError}
        setRegisterEmailError={setRegisterEmailError}
        registerPasswordError={registerPasswordError}
        setRegisterPasswordError={setRegisterPasswordError}
        registerConfirmPasswordError={registerConfirmPasswordError}
        setRegisterConfirmPasswordError={setRegisterConfirmPasswordError}
        loginGlobalError={loginGlobalError}
        registerGlobalError={registerGlobalError}
        modalScrollViewRef={modalScrollViewRef}
        emailInputRef={emailInputRef}
        registerNameInputRef={registerNameInputRef}
        registerEmailInputRef={registerEmailInputRef}
        registerPasswordInputRef={registerPasswordInputRef}
        registerConfirmPasswordInputRef={registerConfirmPasswordInputRef}
        isSwitchingModeRef={isSwitchingModeRef}
        validateEmail={validateEmail}
        validatePassword={validatePassword}
        isLoading={isLoading}
        globalErrorOpacity={globalErrorOpacity}
      />
    </View>
  );
}
