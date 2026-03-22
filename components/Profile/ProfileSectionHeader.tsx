/**
 * 区块标题
 * 如「数据与安全」「其他」
 */

import React, { useMemo } from "react";
import { Text, useWindowDimensions } from "react-native";
import { createProfileStyles } from "../../styles/components/Profile.styles";

interface ProfileSectionHeaderProps {
  title: string;
}

export function ProfileSectionHeader({ title }: ProfileSectionHeaderProps) {
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
  return <Text style={profileStyles.menuHeader}>{title}</Text>;
}
