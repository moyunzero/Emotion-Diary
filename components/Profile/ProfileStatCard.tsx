/**
 * 统计卡片（单条）
 * 用于心事记录、心情指数等
 */

import React, { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { createProfileStyles } from "../../styles/components/Profile.styles";

interface ProfileStatCardProps {
  /** 主数字 */
  readonly value: number | string;
  /** 标签文字 */
  readonly label: string;
  /** 是否使用强调色（如心情指数用红色） */
  readonly accent?: boolean;
}

export function ProfileStatCard({
  value,
  label,
  accent = false,
}: ProfileStatCardProps) {
  const { width, height } = useWindowDimensions();
  const { profileStyles } = useMemo(
    () => createProfileStyles(width, height),
    [width, height]
  );
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
