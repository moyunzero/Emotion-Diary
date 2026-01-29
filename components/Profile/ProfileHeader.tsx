/**
 * 个人资料页头部
 * 返回按钮 + 右侧占位，保持布局对称
 */

import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { profileStyles } from "../../styles/components/Profile.styles";

interface ProfileHeaderProps {
  onBack: () => void;
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <View style={profileStyles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={profileStyles.backButton}
        accessibilityRole="button"
        accessibilityLabel="返回上一页"
      >
        <ChevronLeft size={28} color={COLORS.gray[800]} />
      </TouchableOpacity>
      <View style={profileStyles.headerActions} />
    </View>
  );
}
