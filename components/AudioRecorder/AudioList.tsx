/**
 * 语音列表组件
 * 显示已录制的语音列表，统一管理播放状态
 */

import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AudioData } from "../../types";
import { AudioPreview } from "./AudioPreview";

interface AudioListProps {
  audios: AudioData[];
  currentPlayingId: string | null;
  isPlaying: boolean;
  playbackPosition: number;
  onPlay: (audio: AudioData) => void;
  onPause: () => void;
  onDelete: (audioId: string) => void;
  onRename: (audioId: string, newName: string) => void;
  /** 列表标题，默认「语音列表」；`headerVariant="minimal"` 时不展示 */
  headerTitle?: string;
  /** 列表在录音区上方时收紧上边距 */
  listPlacement?: "after-recording" | "before-recording";
  /** minimal：仅右侧条数，避免与外层区块标题重复一层语义 */
  headerVariant?: "default" | "minimal";
}

export const AudioList: React.FC<AudioListProps> = ({
  audios,
  currentPlayingId,
  isPlaying,
  playbackPosition,
  onPlay,
  onPause,
  onDelete,
  onRename,
  headerTitle,
  listPlacement = "after-recording",
  headerVariant = "default",
}) => {
  const { t } = useTranslation("record");
  const resolvedHeaderTitle = headerTitle ?? t("audio.list.headerTitle");

  if (!audios || audios.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: AudioData }) => (
    <AudioPreview
      audio={item}
      isPlaying={isPlaying && currentPlayingId === item.id}
      playbackPosition={currentPlayingId === item.id ? playbackPosition : 0}
      onPlay={onPlay}
      onPause={onPause}
      onDelete={onDelete}
      onRename={onRename}
    />
  );

  const renderHeader = () => {
    if (headerVariant === "minimal") {
      return (
        <View
          style={styles.headerMinimal}
          accessibilityLabel={t("audio.list.countA11y", {
            count: audios.length,
          })}
        >
          <Text style={styles.headerCountOnly}>
            {t("audio.list.countShort", { count: audios.length })}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{resolvedHeaderTitle}</Text>
        <Text style={styles.headerCount}>
          {t("audio.list.countShort", { count: audios.length })}
        </Text>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    listPlacement === "before-recording" && styles.containerBeforeRecording,
  ];

  return (
    <View style={containerStyle}>
      <FlatList
        data={audios}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  containerBeforeRecording: {
    marginTop: 0,
    marginBottom: 10,
  },
  listContent: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerMinimal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  headerCount: {
    fontSize: 12,
    color: "#666",
  },
  headerCountOnly: {
    fontSize: 12,
    color: "#9CA3AF",
    fontVariant: ["tabular-nums"],
  },
  });
