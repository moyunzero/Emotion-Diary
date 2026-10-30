/**
 * 回收站：查看软删条目、恢复或永久删除。
 */

import { RecycleBinEntryCard } from "@/components/entries/RecycleBinEntryCard";
import { AppScreenShell } from "@/components/AppScreenShell";
import { ScreenFootnote } from "@/components/settings";
import { forceCancelRecording } from "@/shared/audio/recordingCoordinator";
import { onlySoftDeletedEntries } from "@/shared/entries/visibility";
import { formatLocaleDate } from "@/shared/formatting";
import { useAppStore } from "@/store/useAppStore";
import { MoodEntry } from "@/types";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { ArchiveRestore } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/constants/colors";
import { confirmAlert } from "@/utils/confirmAlert";
import { createRecycleBinStyles } from "./recycleBin.styles";

export function RecycleBinScreen() {
  const router = useRouter();
  const { t } = useTranslation("recycle");
  const { t: tCommon } = useTranslation("common");
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createRecycleBinStyles(width, height),
    [width, height],
  );

  const entries = useAppStore((s) => s.entries);
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);
  const restoreEntry = useAppStore((s) => s.restoreEntry);
  const purgeEntryForever = useAppStore((s) => s.purgeEntryForever);

  const deletedEntries = useMemo(
    () => onlySoftDeletedEntries(entries),
    [entries],
  );

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [purgingId, setPurgingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
      };
    }, []),
  );

  const handleRestore = (entry: MoodEntry) => {
    const trimmed = entry.content.trim();
    const preview =
      trimmed.length > 0 ? trimmed.slice(0, 40) : t("restore.emptyPreview");
    void (async () => {
      const confirmed = await confirmAlert({
        title: t("restore.title"),
        message: `${t("restore.messagePrefix")}${preview}${trimmed.length > 40 ? "…" : ""}${t("restore.messageSuffix")}`,
        confirmLabel: t("restore.confirm"),
        cancelLabel: tCommon("actions.cancel"),
      });
      if (!confirmed) return;
      setRestoringId(entry.id);
      try {
        await restoreEntry(entry.id);
      } finally {
        setRestoringId(null);
      }
    })();
  };

  const handlePurge = (entry: MoodEntry) => {
    const trimmed = entry.content.trim();
    const preview =
      trimmed.length > 0 ? trimmed.slice(0, 40) : t("restore.emptyPreview");
    void (async () => {
      const confirmed = await confirmAlert({
        title: t("purge.confirmTitle"),
        message: `${t("purge.confirmMessage")}\n\n「${preview}${trimmed.length > 40 ? "…" : ""}」`,
        confirmLabel: t("purge.confirmOk"),
        cancelLabel: tCommon("actions.cancel"),
        destructive: true,
      });
      if (!confirmed) return;
      setPurgingId(entry.id);
      try {
        await purgeEntryForever(entry.id);
      } finally {
        setPurgingId(null);
      }
    })();
  };

  const renderItem = ({ item }: { item: MoodEntry }) => {
    const deletedLabel =
      typeof item.deletedAt === "number"
        ? formatLocaleDate(item.deletedAt, effectiveLocale)
        : formatLocaleDate(item.timestamp, effectiveLocale);

    return (
      <RecycleBinEntryCard
        entry={item}
        deletedLabel={deletedLabel}
        isRestoring={restoringId === item.id}
        isPurging={purgingId === item.id}
        onRestore={() => handleRestore(item)}
        onPurge={() => handlePurge(item)}
      />
    );
  };

  return (
    <AppScreenShell
      title={t("screen.title")}
      onBack={() => router.back()}
      headerStyle={styles.stackHeader}
      scrollable={false}
    >
      <View style={styles.screenContent}>
        <ScreenFootnote style={styles.footnote}>{t("footnote")}</ScreenFootnote>

        {deletedEntries.length === 0 ? (
          <View style={styles.empty} testID="recycle-bin-empty-state">
            <ArchiveRestore size={40} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>{t("emptyState.title")}</Text>
            <Text style={styles.emptyDesc}>{t("emptyState.body")}</Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            <FlashList
              data={deletedEntries}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}
      </View>
    </AppScreenShell>
  );
}
