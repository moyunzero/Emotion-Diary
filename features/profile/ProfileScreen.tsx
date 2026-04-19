import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { CloudRain, Sun } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  View,
  useWindowDimensions,
} from "react-native";
import CompanionDaysModal from "@/components/CompanionDaysModal";
import { AppScreenShell } from "@/components/AppScreenShell";
import { Toast } from "@/components/Toast";
import { useAppStore } from "@/store/useAppStore";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import { ProfileHeaderSection } from "./components/ProfileHeaderSection";
import { ProfileSettingsSection } from "./components/ProfileSettingsSection";
import { ProfileStatsSection } from "./components/ProfileStatsSection";
import { useProfileAuthHandlers } from "./hooks/useProfileAuthHandlers";
import { useProfileScreenState } from "./hooks/useProfileScreenState";
import { useProfileSyncHandlers } from "./hooks/useProfileSyncHandlers";

export function ProfileScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { profileContentPadding, profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
  const user = useAppStore((state) => state.user);
  const entries = useAppStore((state) => state.entries);
  const weather = useAppStore((state) => state.weather);

  const state = useProfileScreenState();
  const syncHandlers = useProfileSyncHandlers({
    isSyncingRef: state.isSyncingRef,
    setIsLoading: state.setIsLoading,
    setSyncStatus: state.setSyncStatus,
    setSyncProgress: state.setSyncProgress,
    setLastSyncTime: state.setLastSyncTime,
    setIsLoginModalOpen: state.setIsLoginModalOpen,
    setIsRegisterMode: state.setIsRegisterMode,
  });
  const authHandlers = useProfileAuthHandlers({
    isLoading: state.isLoading,
    isRegisterMode: state.isRegisterMode,
    email: state.email,
    password: state.password,
    confirmPassword: state.confirmPassword,
    registerName: state.registerName,
    loginEmailError: state.loginEmailError,
    loginPasswordError: state.loginPasswordError,
    registerNameError: state.registerNameError,
    registerEmailError: state.registerEmailError,
    registerPasswordError: state.registerPasswordError,
    registerConfirmPasswordError: state.registerConfirmPasswordError,
    loginGlobalError: state.loginGlobalError,
    registerGlobalError: state.registerGlobalError,
    editName: state.editName,
    editAvatar: state.editAvatar,
    setIsLoginModalOpen: state.setIsLoginModalOpen,
    setIsEditProfileOpen: state.setIsEditProfileOpen,
    setIsRegisterMode: state.setIsRegisterMode,
    setEmail: state.setEmail,
    setPassword: state.setPassword,
    setConfirmPassword: state.setConfirmPassword,
    setRegisterName: state.setRegisterName,
    setLoginEmailError: state.setLoginEmailError,
    setLoginPasswordError: state.setLoginPasswordError,
    setRegisterNameError: state.setRegisterNameError,
    setRegisterEmailError: state.setRegisterEmailError,
    setRegisterPasswordError: state.setRegisterPasswordError,
    setRegisterConfirmPasswordError: state.setRegisterConfirmPasswordError,
    setLoginGlobalError: state.setLoginGlobalError,
    setRegisterGlobalError: state.setRegisterGlobalError,
    setEditName: state.setEditName,
    setEditAvatar: state.setEditAvatar,
    setIsLoading: state.setIsLoading,
    setToast: state.setToast,
    globalErrorOpacity: state.globalErrorOpacity,
    emailInputRef: state.emailInputRef,
    modalScrollViewRef: state.modalScrollViewRef,
    registerNameInputRef: state.registerNameInputRef,
    registerEmailInputRef: state.registerEmailInputRef,
    registerPasswordInputRef: state.registerPasswordInputRef,
    registerConfirmPasswordInputRef: state.registerConfirmPasswordInputRef,
    isSwitchingModeRef: state.isSwitchingModeRef,
  });

  // 加载最后同步时间
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const time = await AsyncStorage.getItem("last_sync_time");
        if (time) {
          state.setLastSyncTime(parseInt(time, 10));
        }
      } catch {
        // ignore
      }
    };
    loadLastSyncTime();
  }, [state.setLastSyncTime]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      state.setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      state.setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [state.setIsKeyboardVisible]);

  useEffect(() => {
    if (state.isLoginModalOpen && !state.isRegisterMode) {
      const timer = setTimeout(
        () => state.emailInputRef.current?.focus(),
        Platform.OS === "android" ? 500 : 250,
      );
      return () => clearTimeout(timer);
    }
  }, [state.isLoginModalOpen, state.isRegisterMode, state.emailInputRef]);

  const handleBack = () => router.back();

  const closeLoginModal = () => {
    state.setIsLoginModalOpen(false);
    state.setIsRegisterMode(false);
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
  };

  return (
    <View style={profileStyles.container}>
      <View style={profileStyles.bgCircle} />

      <AppScreenShell
        edges={["top", "bottom"]}
        showHeader={false}
        scrollable
        contentContainerStyle={profileContentPadding}
      >
        <ProfileHeaderSection
          onBack={handleBack}
          avatarUri={user?.avatar}
          name={user?.name}
          handle={
            user ? user.email || `@user_${user.id.slice(0, 8)}` : null
          }
          moodIcon={
            user ? (
              weather.score > 20 ? (
                <CloudRain size={16} color="#6B7280" />
              ) : (
                <Sun size={16} color="#F59E0B" />
              )
            ) : undefined
          }
          isLoggedIn={!!user}
          onPress={
            user
              ? authHandlers.openEditProfile
              : () => state.setIsLoginModalOpen(true)
          }
        />

        <ProfileStatsSection
          entriesCount={entries.length}
          weatherScore={weather.score}
          onCompanionDaysPress={() => state.setIsCompanionDaysModalOpen(true)}
        />

        <ProfileSettingsSection
          user={user}
          syncStatus={state.syncStatus}
          syncProgress={state.syncProgress}
          lastSyncTime={state.lastSyncTime}
          formatLastSyncTime={syncHandlers.formatLastSyncTime}
          isLoading={state.isLoading}
          onSyncUpload={() => syncHandlers.handleSyncAction("upload")}
          onSyncDownload={() => syncHandlers.handleSyncAction("download")}
          onLogout={authHandlers.handleLogout}
          onDeleteAccount={authHandlers.handleDeleteAccount}
          isLoginModalOpen={state.isLoginModalOpen}
          onCloseLoginModal={closeLoginModal}
          isEditProfileOpen={state.isEditProfileOpen}
          onCloseEditProfileModal={() => state.setIsEditProfileOpen(false)}
          isRegisterMode={state.isRegisterMode}
          onSwitchMode={authHandlers.handleSwitchMode}
          onLogin={authHandlers.handleLogin}
          email={state.email}
          setEmail={state.setEmail}
          password={state.password}
          setPassword={state.setPassword}
          confirmPassword={state.confirmPassword}
          setConfirmPassword={state.setConfirmPassword}
          registerName={state.registerName}
          setRegisterName={state.setRegisterName}
          loginEmailError={state.loginEmailError}
          setLoginEmailError={state.setLoginEmailError}
          loginPasswordError={state.loginPasswordError}
          setLoginPasswordError={state.setLoginPasswordError}
          registerNameError={state.registerNameError}
          setRegisterNameError={state.setRegisterNameError}
          registerEmailError={state.registerEmailError}
          setRegisterEmailError={state.setRegisterEmailError}
          registerPasswordError={state.registerPasswordError}
          setRegisterPasswordError={state.setRegisterPasswordError}
          registerConfirmPasswordError={state.registerConfirmPasswordError}
          setRegisterConfirmPasswordError={
            state.setRegisterConfirmPasswordError
          }
          loginGlobalError={state.loginGlobalError}
          registerGlobalError={state.registerGlobalError}
          modalScrollViewRef={state.modalScrollViewRef}
          emailInputRef={state.emailInputRef}
          registerNameInputRef={state.registerNameInputRef}
          registerEmailInputRef={state.registerEmailInputRef}
          registerPasswordInputRef={state.registerPasswordInputRef}
          registerConfirmPasswordInputRef={state.registerConfirmPasswordInputRef}
          isSwitchingModeRef={state.isSwitchingModeRef}
          validateEmail={authHandlers.validateEmail}
          validatePassword={authHandlers.validatePassword}
          editName={state.editName}
          setEditName={state.setEditName}
          editAvatar={state.editAvatar}
          setEditAvatar={state.setEditAvatar}
          isKeyboardVisible={state.isKeyboardVisible}
          onSaveProfile={authHandlers.handleSaveProfile}
          globalErrorOpacity={state.globalErrorOpacity}
        />
      </AppScreenShell>

      {state.isLoading && (
        <View style={profileStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      )}

      <CompanionDaysModal
        visible={state.isCompanionDaysModalOpen}
        onClose={() => state.setIsCompanionDaysModalOpen(false)}
      />

      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onHide={() => state.setToast(null)}
        />
      )}
    </View>
  );
}
