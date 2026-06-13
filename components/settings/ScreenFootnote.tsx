/**
 * Apple Settings 风格说明/footer 小字
 */

import React, { useMemo } from "react";
import { StyleProp, Text, TextStyle, useWindowDimensions } from "react-native";
import { createSettingsStyles } from "./settings.styles";

export type ScreenFootnoteProps = {
  readonly children: string;
  readonly style?: StyleProp<TextStyle>;
};

export function ScreenFootnote({ children, style }: ScreenFootnoteProps) {
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createSettingsStyles(width, height),
    [width, height],
  );

  return <Text style={[styles.footnote, style]}>{children}</Text>;
}
