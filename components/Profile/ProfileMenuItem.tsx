/**
 * 菜单项
 * 图标 + 文字 + 可选右侧箭头 / 副文案
 */

import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { profileStyles } from "../../styles/components/Profile.styles";

export interface ProfileMenuItemProps {
  /** 左侧图标组件（已传入 size/color） */
  icon: React.ReactNode;
  /** 图标背景色，如 '#FEF2F2' */
  iconBgColor?: string;
  /** 主文案 */
  title: string;
  /** 副文案（如「正在备份...」） */
  subtext?: string;
  /** 是否显示右侧箭头 */
  showChevron?: boolean;
  /** 是否使用危险色（红色） */
  danger?: boolean;
  /** 是否禁用（置灰、不可点） */
  disabled?: boolean;
  onPress: () => void;
}

export function ProfileMenuItem({
  icon,
  iconBgColor = COLORS.gray[50],
  title,
  subtext,
  showChevron = true,
  danger = false,
  disabled = false,
  onPress,
}: ProfileMenuItemProps) {
  return (
    <TouchableOpacity
      style={[
        profileStyles.menuItem,
        disabled && profileStyles.menuItemDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[profileStyles.menuIcon, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <View style={profileStyles.menuTextContainer}>
        <Text
          style={[
            profileStyles.menuText,
            danger && profileStyles.menuTextDanger,
          ]}
        >
          {title}
        </Text>
        {subtext != null && subtext !== "" && (
          <Text style={profileStyles.menuSubtext}>{subtext}</Text>
        )}
      </View>
      {showChevron && !disabled && (
        <ChevronRight size={20} color={COLORS.gray[300]} />
      )}
    </TouchableOpacity>
  );
}
