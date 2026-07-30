/**
 * 数据与安全区：同步状态、上传/拉取、回收站
 */

import {
  Archive,
  CheckCircle,
  CloudDownload,
  CloudUpload,
  X,
} from "lucide-react-native";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ProfileMenuItem, ProfileSectionHeader } from "@/components/Profile";
import {
  GroupedSettingsCard,
  ScreenFootnote,
} from "@/components/settings";
import { createSettingsStyles } from "@/components/settings/settings.styles";
import { COLORS } from "@/constants/colors";
import type { StoreSyncStatus } from "@/store/modules/types";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import {
  isSyncActionDisabled,
  mapSyncChromeIcon,
  mapSyncChromeText,
} from "../utils/syncChrome";

export type ProfileDataSecuritySectionProps = {
  user: { id: string; name: string; email?: string; avatar?: string } | null;
  storeSyncStatus: StoreSyncStatus;
  recycleBinCount: number;
  onOpenRecycleBin: () => void;
  syncProgress: string;
  lastSyncTime: number | null;
  formatLastSyncTime: (ts: number | null) => string;
  isLoading: boolean;
  onSyncUpload: () => void;
  onSyncDownload: () => void;
};

export function ProfileDataSecuritySection({
  user,
  storeSyncStatus,
  recycleBinCount,
  onOpenRecycleBin,
  syncProgress,
  lastSyncTime,
  formatLastSyncTime,
  isLoading,
  onSyncUpload,
  onSyncDownload,
}: ProfileDataSecuritySectionProps) {
  const { t: tProfile } = useTranslation("profile");
  const { t: tSync } = useTranslation("sync");
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height],
  );
  const settingsStyles = useMemo(
    () => createSettingsStyles(width, height),
    [width, height],
  );

  const lastSyncLabel = tSync("status.lastSyncPrefix", {
    time: formatLastSyncTime(lastSyncTime),
  });
  const statusText = mapSyncChromeText(
    storeSyncStatus,
    syncProgress,
    {
      syncing: tSync("status.syncing"),
      pending: tSync("status.pending"),
      error: tSync("status.error"),
    },
    lastSyncLabel,
  );
  const syncChromeIcon = mapSyncChromeIcon(storeSyncStatus, syncProgress);
  const syncActionsDisabled = isSyncActionDisabled(storeSyncStatus, isLoading);

  return (
    <>
      <ProfileSectionHeader title={tProfile("sections.dataSecurity")} />

      {user ? (
        <ScreenFootnote>{tSync("sectionHint")}</ScreenFootnote>
      ) : null}

      <GroupedSettingsCard
        statusRow={
          user ? (
            <View style={settingsStyles.statusRow}>
              {syncChromeIcon === "spinner" ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primaryDark}
                  style={settingsStyles.statusIcon}
                />
              ) : null}
              {syncChromeIcon === "error" ? (
                <X size={16} color={COLORS.error} style={settingsStyles.statusIcon} />
              ) : null}
              {syncChromeIcon === "success" ? (
                <CheckCircle
                  size={16}
                  color={COLORS.success}
                  style={settingsStyles.statusIcon}
                />
              ) : null}
              <Text style={settingsStyles.statusText}>{statusText}</Text>
            </View>
          ) : undefined
        }
      >
        <ProfileMenuItem
          icon={<CloudUpload size={20} color={COLORS.primaryDark} />}
          iconBgColor="#FEF2F2"
          title={tSync("uploadTitle")}
          subtext={
            storeSyncStatus === "syncing" || isLoading
              ? tSync("upload.progress")
              : tSync("uploadSubtext")
          }
          showChevron={!(storeSyncStatus === "syncing" || isLoading)}
          disabled={syncActionsDisabled}
          onPress={onSyncUpload}
        />
        <View style={profileStyles.menuDivider} />
        <ProfileMenuItem
          testID="profile-sync-pull"
          icon={<CloudDownload size={20} color={COLORS.primaryDark} />}
          iconBgColor="#EFF6FF"
          title={tSync("pullTitle")}
          subtext={
            storeSyncStatus === "syncing" || isLoading
              ? tSync("pull.progress")
              : tSync("pullSubtext")
          }
          showChevron={!(storeSyncStatus === "syncing" || isLoading)}
          disabled={syncActionsDisabled}
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
    </>
  );
}
