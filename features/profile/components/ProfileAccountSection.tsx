/**
 * 账户区：登出/注销菜单 + 编辑资料 AppSheet
 */

import { LogOut, UserX } from "lucide-react-native";
import { Image } from "expo-image";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef } from "react";
import { ProfileMenuItem, ProfileSectionHeader } from "@/components/Profile";
import { GroupedSettingsCard } from "@/components/settings";
import { AppButton } from "@/components/ui/AppButton";
import { AppSheet } from "@/components/ui/AppSheet";
import { COLORS } from "@/constants/colors";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import {
  AVATAR_PRESETS,
  isSvgAvatarDataUri,
} from "@/utils/avatarPresets";
import { confirmAlert } from "@/utils/confirmAlert";
import { profileScreenModalStyles as ms } from "../styles/profileScreen.styles";

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
  isKeyboardVisible: _isKeyboardVisible,
  onSaveProfile,
  isLoading,
}: ProfileAccountSectionProps) {
  const { t: tProfile } = useTranslation("profile");
  const { t: tAuth } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );

  const baselineRef = useRef<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    if (isEditProfileOpen) {
      baselineRef.current = { name: editName, avatar: editAvatar };
    } else {
      baselineRef.current = null;
    }
    // Snapshot only when sheet opens — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-time baseline
  }, [isEditProfileOpen]);

  const requestClose = async () => {
    const baseline = baselineRef.current;
    const dirty =
      baseline != null &&
      (editName !== baseline.name || editAvatar !== baseline.avatar);
    if (dirty) {
      const discard = await confirmAlert({
        title: "放弃编辑？",
        message: "未保存的修改会丢失。",
        confirmLabel: "放弃编辑",
        cancelLabel: "继续编辑",
      });
      if (!discard) return;
    }
    onCloseEditProfileModal();
  };

  return (
    <>
      <ProfileSectionHeader title={tProfile("sections.account")} />
      <GroupedSettingsCard>
        <ProfileMenuItem
          icon={<LogOut size={20} color={COLORS.error} />}
          iconBgColor={COLORS.mood.level1}
          title={tProfile("account.logout")}
          showChevron={false}
          danger
          onPress={onLogout}
        />
        <View style={profileStyles.menuDivider} />
        <ProfileMenuItem
          icon={<UserX size={20} color={COLORS.error} />}
          iconBgColor={COLORS.mood.level1}
          title={tProfile("account.deleteAccount")}
          subtext={tProfile("account.deleteAccountSubtext")}
          showChevron={false}
          danger
          onPress={onDeleteAccount}
        />
      </GroupedSettingsCard>

      <AppSheet
        visible={isEditProfileOpen}
        onClose={() => {
          void requestClose();
        }}
        title={tAuth("editProfile.modalTitle")}
        closeAccessibilityLabel={tCommon("shell.close")}
        testID="profile-edit-sheet"
        footer={
          <AppButton
            label={tAuth("editProfile.save")}
            onPress={onSaveProfile}
            loading={isLoading}
            disabled={isLoading}
          />
        }
      >
        <ScrollView
          style={ms.modalScrollView}
          contentContainerStyle={[
            ms.modalScrollContent,
            { paddingHorizontal: 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
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
            <Text style={ms.inputLabel}>
              {tAuth("editProfile.nameLabel")}
            </Text>
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
        </ScrollView>
      </AppSheet>
    </>
  );
}
