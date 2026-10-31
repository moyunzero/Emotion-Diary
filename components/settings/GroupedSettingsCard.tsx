/**
 * Apple Settings 风格分组白卡片容器
 */

import React, { useMemo } from "react";
import { StyleProp, View, ViewStyle, useWindowDimensions } from "react-native";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { createSettingsStyles } from "./settings.styles";

export type GroupedSettingsCardProps = {
  readonly children: React.ReactNode;
  /** 可选首行状态（如最后同步） */
  readonly statusRow?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
};

export function GroupedSettingsCard({
  children,
  statusRow,
  style,
  testID,
}: GroupedSettingsCardProps) {
  const { width, height } = useWindowDimensions();
  const { colors } = useThemeStyles();
  const styles = useMemo(
    () => createSettingsStyles(width, height, colors),
    [width, height, colors],
  );

  return (
    <View style={[styles.groupedCard, style]} testID={testID}>
      {statusRow != null ? (
        <>
          {statusRow}
          <View style={styles.groupDivider} />
        </>
      ) : null}
      {children}
    </View>
  );
}
