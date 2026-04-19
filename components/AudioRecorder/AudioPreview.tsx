/**
 * 语音预览组件
 * 显示单条语音的播放/暂停、时长、重命名、删除
 */

import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Play,
  Pause,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react-native";
import { AudioData } from "../../types";

interface AudioPreviewProps {
  audio: AudioData;
  isPlaying: boolean;
  playbackPosition: number;
  onPlay: (audio: AudioData) => void;
  onPause: () => void;
  onDelete: (audioId: string) => void;
  onRename: (audioId: string, newName: string) => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const AudioPreview: React.FC<AudioPreviewProps> = ({
  audio,
  isPlaying,
  playbackPosition,
  onPlay,
  onPause,
  onDelete,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(audio.name || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayName = audio.name || `录制于 ${new Date(audio.createdAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const currentPosition = isPlaying ? playbackPosition : 0;
  const progress = audio.duration > 0 ? Math.min(Math.max(currentPosition / audio.duration, 0), 1) : 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay(audio);
    }
  };

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      onRename(audio.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(audio.name || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(audio.id);
    setShowDeleteConfirm(false);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.mainContent} onPress={handlePlayPause}>
        <View style={styles.playButton}>
          {isPlaying ? (
            <Pause size={20} color="#6C63FF" />
          ) : (
            <Play size={20} color="#6C63FF" />
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
                onBlur={handleSaveEdit}
                onSubmitEditing={handleSaveEdit}
              />
            ) : (
              <Text style={styles.audioName} numberOfLines={1}>
                {displayName}
              </Text>
            )}

            <View style={styles.actions}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={handleSaveEdit}
                    style={styles.actionButton}
                  >
                    <Check size={16} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    style={styles.actionButton}
                  >
                    <X size={16} color="#FF5252" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={styles.actionButton}
                  >
                    <Edit3 size={14} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.actionButton}
                  >
                    <Trash2 size={14} color="#FF5252" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.duration}>
              {formatDuration(currentPosition)} / {formatDuration(audio.duration)}
            </Text>
          </View>
        </View>
      </Pressable>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>删除语音</Text>
            <Text style={styles.modalMessage}>
              确定要删除这段语音吗？删除后无法恢复。
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  audioName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#6C63FF",
    paddingVertical: 2,
    marginRight: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6C63FF",
    borderRadius: 2,
  },
  duration: {
    fontSize: 12,
    color: "#666",
    minWidth: 70,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  deleteButton: {
    backgroundColor: "#FF5252",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default AudioPreview;
