/**
 * 个人资料用户卡片
 * 头像、昵称、邮箱、今日心情标签
 */

import { Camera } from "lucide-react-native";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { createProfileStyles } from "../../styles/components/Profile.styles";
import Avatar from "../Avatar";

interface ProfileUserCardProps {
  /** 用户头像 URL */
  avatarUri?: string | null;
  /** 用户昵称 */
  name?: string | null;
  /** 用户邮箱或 ID 展示 */
  handle?: string | null;
  /** 今日心情图标组件 */
  moodIcon?: React.ReactNode;
  /** 是否已登录，未登录时显示「点击登录」 */
  isLoggedIn: boolean;
  /** 点击头像/登录区域 */
  onPress: () => void;
}

const AVATAR_SIZE = 88;

export function ProfileUserCard({
  avatarUri,
  name,
  handle,
  moodIcon,
  isLoggedIn,
  onPress,
}: ProfileUserCardProps) {
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
  return (
    <View style={profileStyles.profileSection}>
      <TouchableOpacity
        onPress={onPress}
        style={profileStyles.avatarWrapper}
        accessibilityRole="button"
        accessibilityLabel={isLoggedIn ? "编辑个人资料" : "点击登录"}
      >
        <Avatar
          uri={avatarUri ?? undefined}
          name={name ?? undefined}
          size={AVATAR_SIZE}
          style={profileStyles.avatar}
        />
        {isLoggedIn && (
          <View style={profileStyles.editBadge}>
            <Camera size={14} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>

      <View style={profileStyles.userInfo}>
        {isLoggedIn ? (
          <>
            <Text style={profileStyles.userName} numberOfLines={1}>
              {name ?? "未设置昵称"}
            </Text>
            <Text style={profileStyles.userHandle} numberOfLines={1}>
              {handle ?? ""}
            </Text>
            {moodIcon != null && (
              <View style={profileStyles.moodBadge}>
                {moodIcon}
              </View>
            )}
          </>
        ) : (
          <TouchableOpacity onPress={onPress} accessibilityRole="button">
            <Text style={profileStyles.loginTitle}>点击登录</Text>
            <Text style={profileStyles.loginSubtitle}>开启您的情绪之旅</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
