/**
 * 区块标题
 * 如「数据与安全」「其他」
 */

import React from "react";
import { Text } from "react-native";
import { profileStyles } from "../../styles/components/Profile.styles";

interface ProfileSectionHeaderProps {
  title: string;
}

export function ProfileSectionHeader({ title }: ProfileSectionHeaderProps) {
  return <Text style={profileStyles.menuHeader}>{title}</Text>;
}
