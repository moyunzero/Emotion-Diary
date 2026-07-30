import { COLORS } from "@/constants/colors";
import { CheckCircle, Edit, Flame, Trash2 } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { createEntryCardStyles } from "../../styles/components/EntryCard.styles";

export type EntryCardActionsProps = {
  styles: ReturnType<typeof createEntryCardStyles>;
  isExpanded: boolean;
  isResolved: boolean;
  isBurned: boolean;
  isPreparing: boolean;
  onEdit: () => void;
  onResolvePress: () => void;
  onBurnPress: () => void;
  onDelete: () => void;
};

export function EntryCardActions({
  styles,
  isExpanded,
  isResolved,
  isBurned,
  isPreparing,
  onEdit,
  onResolvePress,
  onBurnPress,
  onDelete,
}: EntryCardActionsProps) {
  const { t } = useTranslation("dashboard");

  if (!isExpanded || isResolved || isBurned) {
    return null;
  }

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={t("entryCard.editA11y")}
        accessibilityHint={t("entryCard.editHint")}
      >
        <View style={styles.actionIcon}>
          <Edit size={20} color={COLORS.primaryDark} />
        </View>
        <Text style={styles.actionText}>{t("entryCard.edit")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onResolvePress}
        testID="entry-resolve-button"
        accessibilityRole="button"
        accessibilityLabel={t("entryCard.resolveA11y")}
        accessibilityHint={t("entryCard.resolveHint")}
      >
        <View style={styles.actionIcon}>
          <CheckCircle size={20} color={COLORS.mood.icon.level4} />
        </View>
        <Text style={styles.actionText}>{t("entryCard.resolve")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, isPreparing && { opacity: 0.5 }]}
        onPress={onBurnPress}
        disabled={isPreparing}
        testID="entry-burn-button"
        accessibilityRole="button"
        accessibilityLabel={t("entryCard.burnA11y")}
        accessibilityHint={t("entryCard.burnHint")}
        accessibilityState={{ disabled: isPreparing }}
      >
        {isPreparing ? (
          <ActivityIndicator size="small" color={COLORS.mood.icon.level5} />
        ) : (
          <>
            <View style={styles.actionIcon}>
              <Flame size={22} color={COLORS.mood.icon.level5} />
            </View>
            <Text style={styles.actionText}>{t("entryCard.burn")}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={onDelete}
        testID="entry-delete-button"
        accessibilityRole="button"
        accessibilityLabel={t("entryCard.deleteA11y")}
        accessibilityHint={t("entryCard.deleteHint")}
      >
        <View style={styles.actionIcon}>
          <Trash2 size={18} color={COLORS.text.tertiary} />
        </View>
        <Text style={[styles.actionText, styles.deleteActionText]}>
          {t("entryCard.delete")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
