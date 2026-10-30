import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { Check, X } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { appChipSelectedShowsCheck } from "./appChipContract";

export { appChipSelectedShowsCheck } from "./appChipContract";

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
 * Shared chip primitive (PRIM-02).
 * Unselected: surface + hairline + text.secondary.
 * Selected: brandSoft + brand label + lucide Check 16 — not color-only.
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
  const labelColor = selected ? COLORS.brand : COLORS.text.secondary;
  const showsCheck = appChipSelectedShowsCheck(selected);

  return (
    <View
      style={[
        styles.shell,
        selected ? styles.shellSelected : styles.shellUnselected,
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
        {showsCheck ? (
          <Check
            size={16}
            color={COLORS.brand}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
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
          <X size={12} color={COLORS.gray[500]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: "row",
    alignItems: "center",
    height: APP_CHIP_HEIGHT,
    borderRadius: DESIGN_TOKENS.borderRadius.large,
    borderWidth: 1,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  shellUnselected: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.hairline,
  },
  shellSelected: {
    backgroundColor: COLORS.brandSoft,
    borderColor: COLORS.brandSoft,
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
    fontWeight: "600",
  },
  delete: {
    paddingHorizontal: DESIGN_TOKENS.spacing.sm,
    height: APP_CHIP_HEIGHT,
    justifyContent: "center",
    opacity: 0.6,
  },
});
