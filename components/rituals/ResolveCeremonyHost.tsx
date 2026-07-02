import { COLORS } from "@/constants/colors";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Sprout } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface ResolveCeremonyHostProps {
  visible: boolean;
  onComplete: () => void;
}

const CEREMONY_DURATION_MS = 3000;

export default function ResolveCeremonyHost({
  visible,
  onComplete,
}: ResolveCeremonyHostProps) {
  const { t } = useTranslation("rituals");
  const { trigger: triggerHaptic } = useHapticFeedback();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  onCompleteRef.current = onComplete;

  const finishCeremony = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    triggerHaptic("success");
    onCompleteRef.current();
  };

  useEffect(() => {
    if (!visible) {
      completedRef.current = false;
      opacity.setValue(0);
      scale.setValue(0.8);
      return;
    }

    completedRef.current = false;
    triggerHaptic("light");

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: CEREMONY_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: CEREMONY_DURATION_MS * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: CEREMONY_DURATION_MS * 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        finishCeremony();
      }
    });

    return () => {
      animation.stop();
    };
  }, [visible, opacity, scale, triggerHaptic]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.host} testID="resolve-ceremony-root" pointerEvents="box-none">
      <Animated.View
        style={[styles.content, { opacity, transform: [{ scale }] }]}
      >
        <Sprout size={48} color={COLORS.ritual.resolve} />
        <Text style={styles.title}>{t("resolve.ceremony.title")}</Text>
        <Text style={styles.body}>{t("resolve.ceremony.body")}</Text>
      </Animated.View>

      <Pressable
        style={styles.skipButton}
        onPress={finishCeremony}
        testID="resolve-ceremony-skip"
        accessibilityRole="button"
        accessibilityLabel={t("resolve.ceremony.skip")}
        hitSlop={8}
      >
        <Text style={styles.skipText}>{t("resolve.ceremony.skip")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 245, 247, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: 16,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.text.secondary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
  },
  skipButton: {
    position: "absolute",
    top: 48,
    right: 24,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
});
