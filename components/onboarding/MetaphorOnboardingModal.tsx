import { COLORS } from "@/constants/colors";
import { CloudSun, Flower2, LucideIcon, PenLine } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createOnboardingStyles } from "./onboarding.styles";

type SlideKey = "weather" | "record" | "garden";

interface SlideConfig {
  key: SlideKey;
  icon: LucideIcon;
  slideTestId: string;
}

const SLIDES: SlideConfig[] = [
  { key: "weather", icon: CloudSun, slideTestId: "onboarding-slide-1" },
  { key: "record", icon: PenLine, slideTestId: "onboarding-slide-2" },
  { key: "garden", icon: Flower2, slideTestId: "onboarding-slide-3" },
];

export interface MetaphorOnboardingModalProps {
  visible: boolean;
  onNext?: () => void;
  onStart: () => void;
  onSkip: () => void;
}

export function MetaphorOnboardingModal({
  visible,
  onNext,
  onStart,
  onSkip,
}: MetaphorOnboardingModalProps) {
  const { t } = useTranslation("onboarding");
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createOnboardingStyles(width, height),
    [width, height],
  );
  const [slideIndex, setSlideIndex] = useState(0);

  const slide = SLIDES[slideIndex];
  const Icon = slide.icon;
  const isLastSlide = slideIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      return;
    }
    setSlideIndex((prev) => prev + 1);
    onNext?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : undefined}
      onRequestClose={() => {}}
      testID="onboarding-modal-root"
    >
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.content} pointerEvents="box-none">
          <View style={styles.slide} testID={slide.slideTestId}>
            <View style={styles.iconContainer}>
              <Icon size={48} color={COLORS.primaryDark} strokeWidth={2} />
            </View>
            <Text style={styles.title}>{t(`slides.${slide.key}.title`)}</Text>
            <Text style={styles.body}>{t(`slides.${slide.key}.body`)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, index) => (
              <View
                key={SLIDES[index].key}
                testID={`onboarding-dot-${index + 1}`}
                style={[
                  styles.dot,
                  index === slideIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              testID="onboarding-skip-button"
              style={styles.skipButton}
              onPress={onSkip}
            >
              <Text style={styles.skipText}>{t("actions.skip")}</Text>
            </Pressable>

            {isLastSlide ? (
              <Pressable
                accessibilityRole="button"
                testID="onboarding-start-button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
                onPress={onStart}
              >
                <Text style={styles.primaryButtonText}>
                  {t("actions.start")}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                testID="onboarding-next-button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.primaryButtonText}>
                  {t("actions.next")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
