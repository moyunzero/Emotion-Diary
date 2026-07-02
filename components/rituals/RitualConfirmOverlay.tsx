import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { Flame, Sprout, type LucideIcon } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export type RitualConfirmVariant = "resolve" | "burn";

export interface RitualConfirmOverlayProps {
  variant: RitualConfirmVariant;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<
  RitualConfirmVariant,
  { Icon: LucideIcon; accent: string; testIdPrefix: string; keyPrefix: string }
> = {
  resolve: {
    Icon: Sprout,
    accent: COLORS.ritual.resolve,
    testIdPrefix: "resolve-confirm",
    keyPrefix: "resolve.confirm",
  },
  burn: {
    Icon: Flame,
    accent: COLORS.ritual.burn,
    testIdPrefix: "burn-confirm",
    keyPrefix: "burn.confirm",
  },
};

export default function RitualConfirmOverlay({
  variant,
  visible,
  onConfirm,
  onCancel,
}: RitualConfirmOverlayProps) {
  const { t } = useTranslation("rituals");
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(340, screenWidth - 48);
  const { Icon, accent, testIdPrefix, keyPrefix } = VARIANT_CONFIG[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={onCancel}
    >
      <View style={styles.overlay} testID={`${testIdPrefix}-root`}>
        <View style={[styles.card, { width: cardWidth }]}>
          <Icon size={32} color={accent} />
          <Text style={styles.title}>
            {t(`${keyPrefix}.title` as "resolve.confirm.title")}
          </Text>
          <Text style={styles.message}>
            {t(`${keyPrefix}.message` as "resolve.confirm.message")}
          </Text>

          <Pressable
            style={[styles.confirmButton, { backgroundColor: accent }]}
            onPress={onConfirm}
            testID={`${testIdPrefix}-confirm`}
            accessibilityRole="button"
            accessibilityLabel={t(
              `${keyPrefix}.confirm` as "resolve.confirm.confirm",
            )}
          >
            <Text style={styles.confirmText}>
              {t(`${keyPrefix}.confirm` as "resolve.confirm.confirm")}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            testID={`${testIdPrefix}-cancel`}
            accessibilityRole="button"
            accessibilityLabel={t(
              `${keyPrefix}.cancel` as "resolve.confirm.cancel",
            )}
          >
            <Text style={styles.cancelText}>
              {t(`${keyPrefix}.cancel` as "resolve.confirm.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31,41,55,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: DESIGN_TOKENS.spacing.xxl,
  },
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 20,
    padding: DESIGN_TOKENS.spacing.xl,
    alignItems: "center",
    ...DESIGN_TOKENS.shadow.xl,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: DESIGN_TOKENS.spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.text.secondary,
    marginTop: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.lg,
    textAlign: "center",
    lineHeight: 21,
  },
  confirmButton: {
    width: "100%",
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cancelButton: {
    width: "100%",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "400",
    color: COLORS.text.secondary,
  },
});
