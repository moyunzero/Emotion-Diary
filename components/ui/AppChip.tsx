import { DESIGN_TOKENS } from "@/constants/colors";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { X } from "lucide-react-native";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { appChipSelectedBorderWidth } from "./appChipContract";

export {
  appChipSelectedBorderWidth,
  appChipSelectedShowsCheck,
} from "./appChipContract";

/** Visual height; hitSlop pads to ≥44 (PRIM-05). */
export const APP_CHIP_HEIGHT = 32;
const CHIP_HIT_SLOP = Math.ceil((44 - APP_CHIP_HEIGHT) / 2);

export type AppChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Optional leading glyph (e.g. custom-deadline Edit). */
  leading?: React.ReactNode;
  /** Custom-tag delete affordance (people/trigger). */
  onDelete?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared chip primitive (PRIM-02 / G-23-2).
 * Unselected: surface + hairline + text.secondary.
 * Selected: brandSoft + brand label + brand border (1.5–2) — not color-only; no checkmark.
 */
export function AppChip({
  label,
  selected,
  onPress,
  leading,
  onDelete,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: AppChipProps) {
  const { colors } = useThemeStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          flexDirection: "row",
          alignItems: "center",
          height: APP_CHIP_HEIGHT,
          borderRadius: DESIGN_TOKENS.borderRadius.large,
          overflow: "hidden",
          borderCurve: "continuous",
        },
        shellUnselected: {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
        },
        shellSelected: {
          backgroundColor: colors.brandSoft,
          borderColor: colors.brand,
        },
        main: {
          flexDirection: "row",
          alignItems: "center",
          gap: DESIGN_TOKENS.spacing.xs,
          paddingHorizontal: DESIGN_TOKENS.spacing.md,
          height: APP_CHIP_HEIGHT,
        },
        label: {
          fontSize: DESIGN_TOKENS.fontSize.sm,
        },
        delete: {
          paddingHorizontal: DESIGN_TOKENS.spacing.sm,
          height: APP_CHIP_HEIGHT,
          justifyContent: "center",
          opacity: 0.6,
        },
      }),
    [colors],
  );

  const labelColor = selected ? colors.brand : colors.text.secondary;

  return (
    <View
      style={[
        styles.shell,
        selected ? styles.shellSelected : styles.shellUnselected,
        { borderWidth: appChipSelectedBorderWidth(selected) },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        hitSlop={CHIP_HIT_SLOP}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ selected }}
        testID={testID}
      >
        {leading}
        <Text
          style={[
            styles.label,
            {
              color: labelColor,
              // UI-SPEC echo chips: unselected 400 / selected 600
              fontWeight: selected ? "600" : "400",
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          hitSlop={CHIP_HIT_SLOP}
          style={styles.delete}
          accessibilityRole="button"
          accessibilityLabel="delete"
        >
          <X size={12} color={colors.gray[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}
