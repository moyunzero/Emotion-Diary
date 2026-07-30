/**
 * 登录/注册 Modal
 */

import { User as UserIcon, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Animated,
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
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { profileScreenModalStyles as ms } from "../styles/profileScreen.styles";

export type ProfileAuthModalsProps = {
  isLoginModalOpen: boolean;
  onCloseLoginModal: () => void;
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
  isLoading: boolean;
  globalErrorOpacity: Animated.Value;
};

export function ProfileAuthModals({
  isLoginModalOpen,
  onCloseLoginModal,
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
  isLoading,
  globalErrorOpacity,
}: ProfileAuthModalsProps) {
  const { t: tAuth } = useTranslation("auth");
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const tError = (key: string): string =>
    tAuth(`errors.${key}`, { defaultValue: key });

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
                  <UserIcon size={32} color={COLORS.primaryDark} />
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
                      testID="login-email-input"
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
                      testID="login-password-input"
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
                testID="login-submit-button"
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
  );
}
