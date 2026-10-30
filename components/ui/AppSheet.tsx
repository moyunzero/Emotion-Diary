/**
 * Shared form sheet shell (PRIM-03 / D-11..D-14).
 * Half → full via handle; scrim / handle-down / X dismiss. No @gorhom/bottom-sheet.
 * Dirty discard is gated by callers (confirmAlert) before onClose — AppSheet only invokes onClose.
 */

import { X } from "lucide-react-native";
import { useCallback, useEffect, type ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, DESIGN_TOKENS, withOpacity } from "@/constants/colors";

export type AppSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** A11y for trailing close; default 关闭 / Close. */
  closeAccessibilityLabel?: string;
  testID?: string;
};

const HALF_RATIO = 0.5;
const FULL_RATIO = 0.92;
const DISMISS_DRAG = 100;
const SPRING = { damping: 22, stiffness: 220 };

export function AppSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  closeAccessibilityLabel = "关闭",
  testID,
}: AppSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const halfH = Math.round(windowHeight * HALF_RATIO);
  const fullH = Math.round(windowHeight * FULL_RATIO);

  const sheetHeight = useSharedValue(halfH);
  const dragY = useSharedValue(0);
  const scrimOpacity = useSharedValue(0);
  const panStartHeight = useSharedValue(halfH);

  const finishClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const animateOutThenClose = useCallback(() => {
    scrimOpacity.value = withTiming(0, { duration: 180 });
    dragY.value = withTiming(sheetHeight.value, { duration: 220 }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  }, [dragY, finishClose, scrimOpacity, sheetHeight]);

  const requestClose = useCallback(() => {
    animateOutThenClose();
  }, [animateOutThenClose]);

  useEffect(() => {
    if (!visible) return;
    sheetHeight.value = halfH;
    dragY.value = halfH;
    scrimOpacity.value = 0;
    dragY.value = withSpring(0, SPRING);
    scrimOpacity.value = withTiming(1, { duration: 220 });
  }, [visible, halfH, sheetHeight, dragY, scrimOpacity]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      panStartHeight.value = sheetHeight.value;
    })
    .onUpdate((e) => {
      const next = panStartHeight.value - e.translationY;
      if (next >= halfH && next <= fullH) {
        sheetHeight.value = next;
        dragY.value = 0;
      } else if (next < halfH) {
        sheetHeight.value = halfH;
        dragY.value = halfH - next;
      } else {
        sheetHeight.value = fullH;
        dragY.value = 0;
      }
    })
    .onEnd((e) => {
      if (dragY.value > DISMISS_DRAG || e.velocityY > 900) {
        runOnJS(requestClose)();
        return;
      }
      dragY.value = withSpring(0, SPRING);
      const mid = (halfH + fullH) / 2;
      const target =
        e.velocityY < -400
          ? fullH
          : e.velocityY > 400
            ? halfH
            : sheetHeight.value >= mid
              ? fullH
              : halfH;
      sheetHeight.value = withSpring(target, SPRING);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
    transform: [{ translateY: dragY.value }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: scrimOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.root} testID={testID}>
        <Animated.View
          pointerEvents="box-none"
          style={[styles.scrim, scrimStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={requestClose}
            accessibilityRole="button"
            accessibilityLabel="关闭遮罩"
            testID={testID ? `${testID}-scrim` : undefined}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
          keyboardVerticalOffset={0}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              DESIGN_TOKENS.shadow.float,
              { paddingBottom: Math.max(insets.bottom, 12) },
              sheetStyle,
            ]}
            testID={testID ? `${testID}-panel` : undefined}
          >
            <GestureDetector gesture={pan}>
              <Animated.View
                style={styles.handleHit}
                accessibilityRole="adjustable"
                accessibilityLabel="拖动手柄"
                testID={testID ? `${testID}-handle` : undefined}
              >
                <View style={styles.handle} />
              </Animated.View>
            </GestureDetector>

            <View style={styles.header}>
              {title ? (
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                <View style={styles.titleSpacer} />
              )}
              <Pressable
                onPress={requestClose}
                accessibilityRole="button"
                accessibilityLabel={closeAccessibilityLabel}
                hitSlop={8}
                style={styles.closeButton}
                testID={testID ? `${testID}-close` : undefined}
              >
                <X size={22} color={COLORS.text.tertiary} />
              </Pressable>
            </View>

            <View style={styles.body}>{children}</View>
            {footer != null ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withOpacity("#000000", 0.45),
  },
  keyboard: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: DESIGN_TOKENS.borderRadius.xl,
    borderTopRightRadius: DESIGN_TOKENS.borderRadius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  handleHit: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
    paddingTop: DESIGN_TOKENS.spacing.sm,
    paddingBottom: DESIGN_TOKENS.spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.hairline,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingBottom: DESIGN_TOKENS.spacing.sm,
    minHeight: 44,
  },
  title: {
    flex: 1,
    fontSize: DESIGN_TOKENS.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    paddingRight: DESIGN_TOKENS.spacing.sm,
  },
  titleSpacer: {
    flex: 1,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    flexShrink: 0,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: DESIGN_TOKENS.spacing.sm,
  },
});
