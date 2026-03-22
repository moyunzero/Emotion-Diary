/**
 * 个人资料页头部
 * 返回按钮 + 右侧占位，保持布局对称
 */

import { ChevronLeft } from "lucide-react-native";
import React, { useMemo } from "react";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import { COLORS } from "../../constants/colors";
import { createProfileStyles } from "../../styles/components/Profile.styles";

interface ProfileHeaderProps {
  onBack: () => void;
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
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
