/**
 * 区块标题
 * 如「数据与安全」「其他」
 */

import React, { useMemo } from "react";
import { Text, useWindowDimensions } from "react-native";
import { createProfileStyles } from "../../styles/components/Profile.styles";
import { useThemeStyles } from "../../hooks/useThemeStyles";

interface ProfileSectionHeaderProps {
  readonly title: string;
}

export function ProfileSectionHeader({ title }: ProfileSectionHeaderProps) {
  const { width, height } = useWindowDimensions();
  const { colors } = useThemeStyles();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height, colors),
    [width, height, colors],
  );
  return <Text style={profileStyles.menuHeader}>{title}</Text>;
}
