/**
 * 语音预览组件
 * 显示单条语音的播放/暂停、时长、重命名、删除
 */

import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DESIGN_TOKENS } from "@/constants/colors";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import {
  Play,
  Pause,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { i18n } from "@/i18n";
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
  const { t } = useTranslation("record");
  const { t: tCommon } = useTranslation("common");
  const { colors } = useThemeStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.gray[100],
          borderRadius: DESIGN_TOKENS.borderRadius.md,
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
          borderRadius: DESIGN_TOKENS.borderRadius.full,
          backgroundColor: colors.surface,
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
          color: colors.text.primary,
          flex: 1,
          marginRight: 8,
        },
        editInput: {
          flex: 1,
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.audio.primary,
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
          backgroundColor: colors.gray[300],
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
        },
        progressFill: {
          height: "100%",
          backgroundColor: colors.audio.primary,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
        },
        duration: {
          fontSize: 12,
          color: colors.text.secondary,
          minWidth: 70,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        },
        modalContent: {
          backgroundColor: colors.surface,
          borderRadius: DESIGN_TOKENS.borderRadius.md,
          padding: 24,
          width: "80%",
          maxWidth: 320,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: "bold",
          color: colors.text.primary,
          marginBottom: 12,
          textAlign: "center",
        },
        modalMessage: {
          fontSize: 14,
          color: colors.text.secondary,
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
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          alignItems: "center",
        },
        cancelButton: {
          backgroundColor: colors.gray[100],
        },
        cancelButtonText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.secondary,
        },
        deleteButton: {
          backgroundColor: colors.error,
        },
        deleteButtonText: {
          fontSize: 14,
          fontWeight: "600",
          color: colors.text.inverse,
        },
      }),
    [colors],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(audio.name || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatAudioTime = (createdAt: number): string => {
    const locale = i18n.language.startsWith("zh") ? "zh-CN" : "en-US";
    return new Date(createdAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayName =
    audio.name ||
    t("audio.list.recordedAt", { time: formatAudioTime(audio.createdAt) });

  const currentPosition = isPlaying ? playbackPosition : 0;
  const progress = audio.duration > 0 ? Math.min(Math.max(currentPosition / audio.duration, 0), 1) : 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay(audio);
    }
  };

  const beginEdit = () => {
    setEditedName(displayName);
    setIsEditing(true);
  };

  /**
   * Persist only via Check / keyboard Done — never on blur.
   * Leading pattern (Voice Memos / Files): explicit confirm; blur must not race
   * Check onPress (iOS blurs TextInput before sibling onPress, dropping the save).
   * Use onPressIn so commit lands before focus loss.
   */
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
      <View style={styles.mainContent}>
        <Pressable
          style={styles.playButton}
          onPress={handlePlayPause}
          accessibilityRole="button"
        >
          {isPlaying ? (
            <Pause size={20} color={colors.audio.primary} />
          ) : (
            <Play size={20} color={colors.audio.primary} />
          )}
        </Pressable>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
                returnKeyType="done"
                blurOnSubmit
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
                    onPressIn={handleSaveEdit}
                    style={styles.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon("actions.ok")}
                  >
                    <Check size={16} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPressIn={handleCancelEdit}
                    style={styles.actionButton}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon("actions.cancel")}
                  >
                    <X size={16} color={colors.error} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={beginEdit}
                    style={styles.actionButton}
                  >
                    <Edit3 size={14} color={colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.actionButton}
                  >
                    <Trash2 size={14} color={colors.error} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <Pressable
            style={styles.progressContainer}
            onPress={handlePlayPause}
            accessibilityRole="button"
          >
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.duration}>
              {formatDuration(currentPosition)} / {formatDuration(audio.duration)}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("audio.delete.title")}</Text>
            <Text style={styles.modalMessage}>{t("audio.delete.message")}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {tCommon("actions.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>
                  {t("audio.delete.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
