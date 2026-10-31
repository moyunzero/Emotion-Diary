import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { createEntryCardStyles } from "../../styles/components/EntryCard.styles";

export type EntryCardSwipeActionsProps = {
  styles: ReturnType<typeof createEntryCardStyles>;
  isPreparing: boolean;
  onResolvePress: () => void;
  onBurnPress: () => void;
};

/**
 * Right underlay for ACTIVE left-swipe: 和解 + 焚烧 (D-38 / D-41).
 * Opens the same ritual overlays as EntryCardActions — no overlay redesign.
 */
export function EntryCardSwipeActions({
  styles,
  isPreparing,
  onResolvePress,
  onBurnPress,
}: EntryCardSwipeActionsProps) {
  const { t } = useTranslation("dashboard");

  return (
    <View style={styles.swipeActionsRow}>
      <TouchableOpacity
        style={styles.swipeActionResolve}
        onPress={onResolvePress}
        testID="entry-swipe-resolve"
        accessibilityRole="button"
        accessibilityLabel={t("entryCard.swipeResolveA11y")}
      >
        <Text style={styles.swipeActionText}>{t("entryCard.swipeResolve")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeActionBurn, isPreparing && { opacity: 0.5 }]}
        onPress={onBurnPress}
        disabled={isPreparing}
        testID="entry-swipe-burn"
        accessibilityRole="button"
        accessibilityLabel={t("entryCard.swipeBurnA11y")}
        accessibilityState={{ disabled: isPreparing }}
      >
        <Text style={styles.swipeActionText}>{t("entryCard.swipeBurn")}</Text>
      </TouchableOpacity>
    </View>
  );
}
