import { COLORS, DESIGN_TOKENS } from "@/constants/colors";
import { Sprout } from "lucide-react-native";
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

export interface ResolveConfirmOverlayProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ResolveConfirmOverlay({
  visible,
  onConfirm,
  onCancel,
}: ResolveConfirmOverlayProps) {
  const { t } = useTranslation("rituals");
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(340, screenWidth - 48);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={onCancel}
    >
      <View style={styles.overlay} testID="resolve-confirm-root">
        <View style={[styles.card, { width: cardWidth }]}>
          <Sprout size={32} color={COLORS.ritual.resolve} />
          <Text style={styles.title}>{t("resolve.confirm.title")}</Text>
          <Text style={styles.message}>{t("resolve.confirm.message")}</Text>

          <Pressable
            style={styles.confirmButton}
            onPress={onConfirm}
            testID="resolve-confirm-confirm"
            accessibilityRole="button"
            accessibilityLabel={t("resolve.confirm.confirm")}
          >
            <Text style={styles.confirmText}>{t("resolve.confirm.confirm")}</Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            testID="resolve-confirm-cancel"
            accessibilityRole="button"
            accessibilityLabel={t("resolve.confirm.cancel")}
          >
            <Text style={styles.cancelText}>{t("resolve.confirm.cancel")}</Text>
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
    backgroundColor: COLORS.ritual.resolve,
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
