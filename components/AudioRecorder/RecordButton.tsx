/**
 * 录音按钮：按压语义委托全局 recordingCoordinator，状态来自 Zustand。
 */

import * as Haptics from "expo-haptics";
import { Mic, MicOff, StopCircle } from "lucide-react-native";
import React, { useCallback } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { recordingCoordinator } from "../../shared/audio/recordingCoordinator";
import { useAppStore } from "../../store/useAppStore";

interface RecordButtonProps {
  readonly disabled?: boolean;
  /** 编辑等场景：更小主按钮，减少纵向占用 */
  readonly compact?: boolean;
}

function RecordButtonLabel({
  children,
  style,
}: {
  children: string;
  style: React.ComponentProps<typeof Text>["style"];
}) {
  return (
    <Text
      style={style}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
    >
      {children}
    </Text>
  );
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  disabled = false,
  compact = false,
}) => {
  const { t } = useTranslation("record");
  const recordingState = useAppStore((s) => s.recordingState);
  const slideOffsetY = React.useRef(new Animated.Value(0)).current;
  const iconSize = compact ? 20 : 24;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    if (recordingState === "idle" || recordingState === "preview") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      recordingCoordinator.pressIn();
    }
  }, [disabled, recordingState]);

  const handlePressOut = useCallback(() => {
    recordingCoordinator.pressOut();
    slideOffsetY.setValue(0);
  }, [slideOffsetY]);

  const renderButtonContent = () => {
    const textStyle = [styles.buttonText, compact && styles.buttonTextCompact];

    if (disabled) {
      return (
        <View style={styles.buttonContent}>
          <MicOff size={iconSize} color="#999" />
          <RecordButtonLabel
            style={[
              styles.buttonTextDisabled,
              compact && styles.buttonTextDisabledCompact,
            ]}
          >
            {t("audio.recordButton.disabled")}
          </RecordButtonLabel>
        </View>
      );
    }

    switch (recordingState) {
      case "recording":
        return (
          <View style={styles.buttonContent}>
            <StopCircle size={iconSize} color="#fff" />
            <RecordButtonLabel style={textStyle}>
              {t("audio.recordButton.releaseToStop")}
            </RecordButtonLabel>
          </View>
        );

      case "preparing":
        return (
          <View style={styles.buttonContent}>
            <View style={styles.processingIndicator} />
            <RecordButtonLabel style={textStyle}>
              {t("audio.recordButton.preparing")}
            </RecordButtonLabel>
          </View>
        );

      case "canceling":
        return (
          <View style={styles.buttonContent}>
            <Mic size={iconSize} color="#fff" />
            <RecordButtonLabel style={[...textStyle, styles.cancelText]}>
              {t("audio.recordButton.releaseToCancel")}
            </RecordButtonLabel>
          </View>
        );

      case "processing":
        return (
          <View style={styles.buttonContent}>
            <View style={styles.processingIndicator} />
            <RecordButtonLabel style={textStyle}>
              {t("audio.recordButton.processing")}
            </RecordButtonLabel>
          </View>
        );

      case "preview":
        return (
          <View style={styles.buttonContent}>
            <Mic size={iconSize} color="#4CAF50" />
            <RecordButtonLabel style={[...textStyle, styles.previewText]}>
              {t("audio.recordButton.addVoice")}
            </RecordButtonLabel>
          </View>
        );

      case "idle":
      default:
        return (
          <View style={styles.buttonContent}>
            <Mic size={iconSize} color="#fff" />
            <RecordButtonLabel style={textStyle}>
              {t("audio.recordButton.holdToTalk")}
            </RecordButtonLabel>
          </View>
        );
    }
  };

  const needsWideButton =
    disabled ||
    recordingState === "recording" ||
    recordingState === "canceling";

  const getButtonStyle = () => {
    const base = compact ? styles.buttonCompact : styles.button;
    const wide = needsWideButton
      ? compact
        ? styles.buttonCompactWide
        : styles.buttonWide
      : null;
    if (disabled) {
      return [base, wide, styles.buttonDisabled];
    }
    if (recordingState === "recording") {
      return [base, wide, styles.buttonRecording];
    }
    if (recordingState === "canceling") {
      return [base, wide, styles.buttonRecording];
    }
    if (recordingState === "preview") {
      return [base, styles.buttonPreview];
    }
    return [base];
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={getButtonStyle()}
        >
          {renderButtonContent()}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonWrapper: {
    alignItems: "center",
  },
  button: {
    minWidth: 132,
    maxWidth: 248,
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: "#6C63FF",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignSelf: "center",
  },
  buttonWide: {
    minWidth: 176,
    paddingHorizontal: 18,
  },
  buttonCompact: {
    minWidth: 108,
    maxWidth: 210,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    alignSelf: "center",
  },
  buttonCompactWide: {
    minWidth: 156,
    paddingHorizontal: 14,
  },
  buttonRecording: {
    backgroundColor: "#FF5252",
  },
  buttonPreview: {
    backgroundColor: "#4CAF50",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    maxWidth: 188,
  },
  buttonTextCompact: {
    fontSize: 13,
    maxWidth: 132,
  },
  buttonTextDisabled: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextDisabledCompact: {
    fontSize: 13,
  },
  cancelText: {
    color: "#fff",
  },
  previewText: {
    color: "#fff",
  },
  processingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    borderTopColor: "transparent",
  },
});
