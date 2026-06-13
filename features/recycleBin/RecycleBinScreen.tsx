/**
 * 回收站：查看软删条目、恢复或永久删除。
 */

import { RecycleBinEntryCard } from "@/components/entries/RecycleBinEntryCard";
import { AppScreenShell } from "@/components/AppScreenShell";
import { ScreenFootnote } from "@/components/settings";
import { forceCancelRecording } from "@/shared/audio/recordingCoordinator";
import { onlySoftDeletedEntries } from "@/shared/entries/visibility";
import { formatDateChinese } from "@/shared/formatting";
import { useAppStore } from "@/store/useAppStore";
import { MoodEntry } from "@/types";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { ArchiveRestore } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Text, View, useWindowDimensions } from "react-native";
import { PURGE_ENTRY_COPY } from "@/constants/purgeEntry";
import { createRecycleBinStyles } from "./recycleBin.styles";

const RECYCLE_BIN_FOOTNOTE =
  "这里是你从主列表移出的记录。可恢复至首页，或永久删除（不可从回收站找回）。";

export function RecycleBinScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createRecycleBinStyles(width, height),
    [width, height],
  );

  const entries = useAppStore((s) => s.entries);
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
    const preview = trimmed.length > 0 ? trimmed.slice(0, 40) : "这条记录";
    Alert.alert(
      "恢复记录",
      `将「${preview}${trimmed.length > 40 ? "…" : ""}」移回主列表？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "恢复",
          onPress: async () => {
            setRestoringId(entry.id);
            try {
              await restoreEntry(entry.id);
            } finally {
              setRestoringId(null);
            }
          },
        },
      ],
    );
  };

  const handlePurge = (entry: MoodEntry) => {
    const trimmed = entry.content.trim();
    const preview = trimmed.length > 0 ? trimmed.slice(0, 40) : "这条记录";
    Alert.alert(
      PURGE_ENTRY_COPY.confirmTitle,
      `${PURGE_ENTRY_COPY.confirmMessage}\n\n「${preview}${trimmed.length > 40 ? "…" : ""}」`,
      [
        { text: PURGE_ENTRY_COPY.confirmCancel, style: "cancel" },
        {
          text: PURGE_ENTRY_COPY.confirmOk,
          style: "destructive",
          onPress: async () => {
            setPurgingId(entry.id);
            try {
              await purgeEntryForever(entry.id);
            } finally {
              setPurgingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: MoodEntry }) => {
    const deletedLabel =
      typeof item.deletedAt === "number"
        ? formatDateChinese(item.deletedAt)
        : formatDateChinese(item.timestamp);

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
      title="回收站"
      onBack={() => router.back()}
      headerStyle={styles.stackHeader}
      scrollable={false}
    >
      <View style={styles.screenContent}>
        <ScreenFootnote style={styles.footnote}>
          {RECYCLE_BIN_FOOTNOTE}
        </ScreenFootnote>

        {deletedEntries.length === 0 ? (
          <View style={styles.empty}>
            <ArchiveRestore size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>回收站是空的</Text>
            <Text style={styles.emptyDesc}>
              删除记录时会暂存在这里，方便你误删后找回
            </Text>
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
