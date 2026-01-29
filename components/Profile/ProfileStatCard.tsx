/**
 * 统计卡片（单条）
 * 用于心事记录、心情指数等
 */

import React from "react";
import { Text, View } from "react-native";
import { profileStyles } from "../../styles/components/Profile.styles";

export interface ProfileStatCardProps {
  /** 主数字 */
  value: number | string;
  /** 标签文字 */
  label: string;
  /** 是否使用强调色（如心情指数用红色） */
  accent?: boolean;
}

export function ProfileStatCard({
  value,
  label,
  accent = false,
}: ProfileStatCardProps) {
  return (
    <View style={profileStyles.statCard}>
      <Text
        style={[
          profileStyles.statValue,
          accent && profileStyles.statValueAccent,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={profileStyles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
