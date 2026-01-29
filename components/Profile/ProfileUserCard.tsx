/**
 * 个人资料用户卡片
 * 头像、昵称、邮箱、今日心情标签
 */

import { Camera } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { profileStyles } from "../../styles/components/Profile.styles";
import Avatar from "../Avatar";

export interface ProfileUserCardProps {
  /** 用户头像 URL */
  avatarUri?: string | null;
  /** 用户昵称 */
  name?: string | null;
  /** 用户邮箱或 ID 展示 */
  handle?: string | null;
  /** 今日心情文案，如 "今日心情: ☀️" */
  moodText?: string;
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
  moodText,
  isLoggedIn,
  onPress,
}: ProfileUserCardProps) {
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
            {moodText != null && (
              <View style={profileStyles.moodBadge}>
                <Text style={profileStyles.moodText}>{moodText}</Text>
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
