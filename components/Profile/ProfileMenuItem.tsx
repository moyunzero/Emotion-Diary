/**
 * 菜单项
 * 图标 + 文字 + 可选右侧箭头 / 副文案
 */

import { ChevronRight } from "lucide-react-native";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { createProfileStyles } from "../../styles/components/Profile.styles";
import { useThemeStyles } from "../../hooks/useThemeStyles";

interface ProfileMenuItemProps {
  /** 左侧图标组件（已传入 size/color） */
  readonly icon: React.ReactNode;
  /** 图标背景色（如 COLORS.gray[50] / brandSoft） */
  readonly iconBgColor?: string;
  /** 主文案 */
  readonly title: string;
  /** 副文案（如「正在备份...」） */
  readonly subtext?: string;
  /** 是否显示右侧箭头 */
  readonly showChevron?: boolean;
  /** 是否使用危险色（红色） */
  readonly danger?: boolean;
  /** 是否禁用（置灰、不可点） */
  readonly disabled?: boolean;
  /** E2E / Maestro 锚点 */
  readonly testID?: string;
  readonly onPress: () => void;
}

export function ProfileMenuItem({
  icon,
  iconBgColor,
  title,
  subtext,
  showChevron = true,
  danger = false,
  disabled = false,
  testID,
  onPress,
}: ProfileMenuItemProps) {
  const { width, height } = useWindowDimensions();
  const { colors } = useThemeStyles();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height, colors),
    [width, height, colors],
  );
  const resolvedIconBg = iconBgColor ?? colors.gray[50];
  return (
    <TouchableOpacity
      style={[
        profileStyles.menuItem,
        disabled && profileStyles.menuItemDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        style={[profileStyles.menuIcon, { backgroundColor: resolvedIconBg }]}
      >
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
        <ChevronRight size={20} color={colors.gray[300]} />
      )}
    </TouchableOpacity>
  );
}
