/**
 * Person Timeline thin OTD slice (REL-07 / D-04).
 * Lives under components/ so personTimeline can import without features↔features.
 */

import { EditEntryModal } from "@/components/entries";
import { COLORS } from "@/constants/colors";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAppStore } from "@/store/useAppStore";
import type { MoodEntry } from "@/types";
import React, { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

const S = {
  xs: 4,
  sm: 8,
  md: 16,
} as const;

const MAX_ROWS = 3;
const DASHED_BORDER = "rgba(251,113,133,0.35)";

type OnThisDayPersonSlotProps = {
  readonly entries: readonly MoodEntry[];
};

function entryYear(entry: MoodEntry): number {
  return new Date(entry.timestamp).getFullYear();
}

function OnThisDayPersonSlotComponent({ entries }: OnThisDayPersonSlotProps) {
  const { t } = useTranslation("onThisDay");
  const { trigger: triggerHaptic } = useHapticFeedback();
  const [editEntry, setEditEntry] = useState<MoodEntry | null>(null);

  const rows = useMemo(() => entries.slice(0, MAX_ROWS), [entries]);

  const handleOpen = useCallback(
    (entry: MoodEntry) => {
      triggerHaptic("light");
      useAppStore.getState().stopAudio();
      setEditEntry(entry);
    },
    [triggerHaptic],
  );

  const handleClose = useCallback(() => {
    setEditEntry(null);
  }, []);

  const handleSuccess = useCallback(() => {
    triggerHaptic("success");
    setEditEntry(null);
  }, [triggerHaptic]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t("personSlot.label")}</Text>
      {rows.map((entry) => {
        const year = entryYear(entry);
        return (
          <Pressable
            key={entry.id}
            style={({ pressed }) => [
              styles.row,
              pressed && styles.rowPressed,
            ]}
            onPress={() => handleOpen(entry)}
            accessibilityRole="button"
            accessibilityLabel={t("personSlot.rowA11y", { year })}
            testID={`person-otd-row-${entry.id}`}
          >
            <Text style={styles.year}>{String(year)}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {entry.content}
            </Text>
          </Pressable>
        );
      })}
      {editEntry != null ? (
        <EditEntryModal
          entry={editEntry}
          visible
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: DASHED_BORDER,
    padding: S.md,
    marginBottom: S.md,
    gap: S.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    color: COLORS.text.secondary,
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    gap: S.sm,
    paddingVertical: S.xs,
  },
  rowPressed: {
    opacity: 0.85,
  },
  year: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    color: COLORS.primaryDark,
    minWidth: 40,
  },
  preview: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    color: COLORS.text.primary,
  },
});

export const OnThisDayPersonSlot = memo(OnThisDayPersonSlotComponent);
