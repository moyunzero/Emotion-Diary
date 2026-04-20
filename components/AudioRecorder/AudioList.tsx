/**
 * 语音列表组件
 * 显示已录制的语音列表，统一管理播放状态
 */

import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
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
}) => {
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>语音列表</Text>
      <Text style={styles.headerCount}>{audios.length} 条</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
  listContent: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  });
