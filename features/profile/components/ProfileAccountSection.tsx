/**
 * 账户区：登出/注销菜单 + 编辑资料 Modal
 */

import { LogOut, UserX, X } from "lucide-react-native";
import { Image } from "expo-image";
import {
  ActivityIndicator,
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
import { ProfileMenuItem, ProfileSectionHeader } from "@/components/Profile";
import { GroupedSettingsCard } from "@/components/settings";
import { COLORS } from "@/constants/colors";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import {
  AVATAR_PRESETS,
  isSvgAvatarDataUri,
} from "@/utils/avatarPresets";
import { profileScreenModalStyles as ms } from "../styles/profileScreen.styles";
import { useMemo } from "react";

const AVATARS = AVATAR_PRESETS;

export type ProfileAccountSectionProps = {
  onLogout: () => void;
  onDeleteAccount: () => void;
  isEditProfileOpen: boolean;
  onCloseEditProfileModal: () => void;
  editName: string;
  setEditName: (v: string) => void;
  editAvatar: string;
  setEditAvatar: (v: string) => void;
  isKeyboardVisible: boolean;
  onSaveProfile: () => void;
  isLoading: boolean;
};

export function ProfileAccountSection({
  onLogout,
  onDeleteAccount,
  isEditProfileOpen,
  onCloseEditProfileModal,
  editName,
  setEditName,
  editAvatar,
  setEditAvatar,
  isKeyboardVisible,
  onSaveProfile,
  isLoading,
}: ProfileAccountSectionProps) {
  const { t: tProfile } = useTranslation("profile");
  const { t: tAuth } = useTranslation("auth");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );

  return (
    <>
      <ProfileSectionHeader title={tProfile("sections.account")} />
      <GroupedSettingsCard>
        <ProfileMenuItem
          icon={<LogOut size={20} color={COLORS.error} />}
          iconBgColor="#FEF2F2"
          title={tProfile("account.logout")}
          showChevron={false}
          danger
          onPress={onLogout}
        />
        <View style={profileStyles.menuDivider} />
        <ProfileMenuItem
          icon={<UserX size={20} color={COLORS.error} />}
          iconBgColor="#FEF2F2"
          title={tProfile("account.deleteAccount")}
          subtext={tProfile("account.deleteAccountSubtext")}
          showChevron={false}
          danger
          onPress={onDeleteAccount}
        />
      </GroupedSettingsCard>

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
    </>
  );
}
