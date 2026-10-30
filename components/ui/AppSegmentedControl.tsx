import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type AppSegmentedControlSegment<T extends string = string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
};

export type AppSegmentedControlProps<T extends string = string> = {
  segments: readonly AppSegmentedControlSegment<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const SEGMENT_MIN_HEIGHT = 44;

/**
 * Sticky four-equal-segment control (PRIM-04 / D-19..D-22).
 * Selected: brandSoft fill + brand label (quieter 粉纸). Tokens only.
 */
export function AppSegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  testID,
  style,
}: AppSegmentedControlProps<T>) {
  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="tablist"
      testID={testID}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={segment.accessibilityLabel ?? segment.label}
            testID={testID ? `${testID}-${segment.value}` : undefined}
          >
            <Text
              style={[styles.label, selected && styles.labelSelected]}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "stretch",
    minHeight: SEGMENT_MIN_HEIGHT,
    backgroundColor: COLORS.surface,
    borderRadius: DESIGN_TOKENS.borderRadius.medium,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: COLORS.hairline,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    minHeight: SEGMENT_MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.xs,
    borderRadius: DESIGN_TOKENS.borderRadius.small,
    borderCurve: "continuous",
  },
  segmentSelected: {
    backgroundColor: COLORS.brandSoft,
  },
  label: {
    fontSize: DESIGN_TOKENS.fontSize.sm,
    fontWeight: "600",
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  labelSelected: {
    color: COLORS.brand,
  },
});
