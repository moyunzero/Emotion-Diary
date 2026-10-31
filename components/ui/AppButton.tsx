import { DESIGN_TOKENS } from "@/constants/colors";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import React, { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  isAppButtonPressLocked,
  resolveAppButtonDisabledReason,
  type AppButtonVariant,
} from "./appButtonContract";

export {
  APP_BUTTON_VARIANTS,
  isAppButtonPressLocked,
  resolveAppButtonDisabledReason,
  type AppButtonVariant,
} from "./appButtonContract";

export type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  /** Primary defaults true; secondary/text/danger default false. */
  fullWidth?: boolean;
  disabled?: boolean;
  /** Shown above the control when disabled (D-03). */
  disabledReason?: string;
  loading?: boolean;
  /** Short label while loading; falls back to `label`. */
  loadingLabel?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const PRESS_SCALE = 0.97;
const PRESS_MS = 120;

/**
 * Shared button primitive (PRIM-01 / D-01..D-07).
 * Tokens only — no new hex. Primary haptic Light when enabled and not loading.
 */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  fullWidth,
  disabled = false,
  disabledReason,
  loading = false,
  loadingLabel,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  labelStyle,
}: AppButtonProps) {
  const { colors } = useThemeStyles();
  const { styles, variantFace, variantPressedFace } = useMemo(() => {
    const variantFace: Record<
      AppButtonVariant,
      {
        container: ViewStyle;
        label: TextStyle;
        spinner?: string;
      }
    > = {
      primary: {
        container: { backgroundColor: colors.brand },
        label: { color: colors.text.inverse },
        spinner: colors.text.inverse,
      },
      secondary: {
        container: { backgroundColor: colors.brandSoft },
        label: { color: colors.brand },
        spinner: colors.brand,
      },
      text: {
        container: { backgroundColor: "transparent" },
        label: { color: colors.brand },
        spinner: colors.brand,
      },
      danger: {
        container: { backgroundColor: "transparent" },
        label: { color: colors.danger },
        spinner: colors.danger,
      },
    };

    const variantPressedFace: Record<AppButtonVariant, ViewStyle> = {
      primary: { backgroundColor: colors.brandPressed },
      secondary: { opacity: 0.85 },
      text: { opacity: 0.7 },
      danger: { opacity: 0.7 },
    };

    const styles = StyleSheet.create({
      wrap: {
        alignSelf: "flex-start",
      },
      fullWidth: {
        alignSelf: "stretch",
        width: "100%",
      },
      base: {
        minHeight: 50,
        minWidth: 44,
        paddingHorizontal: DESIGN_TOKENS.spacing.xl,
        paddingVertical: DESIGN_TOKENS.spacing.md,
        borderRadius: DESIGN_TOKENS.borderRadius.lg,
        borderCurve: "continuous",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: DESIGN_TOKENS.spacing.sm,
      },
      label: {
        fontSize: DESIGN_TOKENS.fontSize.md,
        fontWeight: "600",
        textAlign: "center",
      },
      disabledContainer: {
        backgroundColor: colors.background.secondary,
      },
      disabledLabel: {
        color: colors.text.tertiary,
      },
      disabledReason: {
        fontSize: DESIGN_TOKENS.fontSize.xs,
        fontWeight: "400",
        color: colors.text.tertiary,
        marginBottom: DESIGN_TOKENS.spacing.sm,
        alignSelf: "stretch",
      },
      spinner: {
        marginRight: 0,
      },
    });

    return { styles, variantFace, variantPressedFace };
  }, [colors]);

  const { trigger } = useHapticFeedback();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const locked = isAppButtonPressLocked({ loading, disabled });
  const reason = resolveAppButtonDisabledReason({ disabled, disabledReason });
  const isFullWidth = fullWidth ?? variant === "primary";
  const displayLabel = loading ? (loadingLabel ?? label) : label;

  const animateTo = useCallback(
    (toValue: number) => {
      if (reduceMotion) return;
      Animated.timing(scale, {
        toValue,
        duration: PRESS_MS,
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, scale],
  );

  const handlePressIn = useCallback(() => {
    if (locked) return;
    animateTo(PRESS_SCALE);
  }, [animateTo, locked]);

  const handlePressOut = useCallback(() => {
    animateTo(1);
  }, [animateTo]);

  const handlePress = useCallback(() => {
    if (locked) return;
    if (variant === "primary") {
      trigger("light");
    }
    onPress();
  }, [locked, onPress, trigger, variant]);

  const face = variantFace[variant];
  const pressedFace = reduceMotion ? variantPressedFace[variant] : null;

  return (
    <View style={[styles.wrap, isFullWidth && styles.fullWidth, style]}>
      {reason != null ? (
        <Text
          style={styles.disabledReason}
          accessibilityLiveRegion="polite"
          testID={testID ? `${testID}-disabled-reason` : undefined}
        >
          {reason}
        </Text>
      ) : null}
      <Animated.View
        style={[
          isFullWidth && styles.fullWidth,
          !reduceMotion && { transform: [{ scale }] },
        ]}
      >
        <Pressable
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: locked, busy: loading }}
          disabled={locked}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.base,
            face.container,
            isFullWidth && styles.fullWidth,
            locked && styles.disabledContainer,
            reduceMotion && pressed && !locked && pressedFace,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              color={
                locked
                  ? colors.text.tertiary
                  : (face.spinner ?? face.label.color)
              }
              style={styles.spinner}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              face.label,
              locked && styles.disabledLabel,
              labelStyle,
            ]}
          >
            {displayLabel}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
