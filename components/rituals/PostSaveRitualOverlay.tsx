/**
 * FLOW-03 post-save peak-end ritual (D-13..D-17).
 * Soft wash + fixed kept-safe sentence — distinct from resolve/burn confirm chrome.
 * Copy key: postSave.keptSafe (「这一刻收好了」 / This moment is kept safe.) — no weather pool.
 */
import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

/** Auto-dismiss window (D-14 / UI-SPEC ≤1000ms). */
export const AUTO_DISMISS_MS = 900;

export interface PostSaveRitualOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function PostSaveRitualOverlay({
  visible,
  onDismiss,
}: PostSaveRitualOverlayProps) {
  const { t } = useTranslation("postSave");
  const { trigger } = useHapticFeedback();
  const [reduceMotion, setReduceMotion] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        /* ignore */
      });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      dismissedRef.current = false;
      return;
    }

    dismissedRef.current = false;
    trigger("light");

    const timer = setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        onDismiss();
      }
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [visible, onDismiss, trigger]);

  const handlePress = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      accessibilityViewIsModal
      onRequestClose={handlePress}
    >
      <Pressable
        style={styles.root}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={t("keptSafe")}
        testID="post-save-ritual-root"
      >
        <View style={[styles.fill, styles.bgBase]} />
        <View
          style={[
            styles.fill,
            styles.wash,
            reduceMotion ? styles.washStatic : null,
          ]}
          pointerEvents="none"
        />
        <View style={styles.copyWrap} pointerEvents="none">
          <Text style={styles.copy}>{t("keptSafe")}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  bgBase: {
    backgroundColor: COLORS.bg,
  },
  wash: {
    backgroundColor: COLORS.brandSoft,
    opacity: 0.45,
  },
  washStatic: {
    opacity: 0.45,
  },
  copyWrap: {
    paddingHorizontal: DESIGN_TOKENS.spacing.pageX,
    paddingVertical: DESIGN_TOKENS.spacing.huge,
  },
  copy: {
    fontSize: DESIGN_TOKENS.fontSize.title,
    fontWeight: "400",
    lineHeight: Math.round(DESIGN_TOKENS.fontSize.title * 1.2),
    color: COLORS.text.primary,
    textAlign: "center",
  },
});
