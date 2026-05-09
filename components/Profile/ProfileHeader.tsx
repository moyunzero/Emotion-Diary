/**
 * 个人资料页头部：返回
 */

import { StackScreenHeader } from "@/components/StackScreenHeader";
import { createProfileStyles } from "@/styles/components/Profile.styles";
import React, { useMemo } from "react";
import { useWindowDimensions } from "react-native";

interface ProfileHeaderProps {
  readonly onBack: () => void;
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
  return (
    <StackScreenHeader
      onBack={onBack}
      backAccessibilityLabel="返回上一页"
      style={profileStyles.stackHeader}
    />
  );
}
