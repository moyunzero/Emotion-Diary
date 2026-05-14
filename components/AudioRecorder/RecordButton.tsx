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
import { recordingCoordinator } from "../../shared/audio/recordingCoordinator";
import { useAppStore } from "../../store/useAppStore";

interface RecordButtonProps {
  readonly disabled?: boolean;
  /** 编辑等场景：更小主按钮，减少纵向占用 */
  readonly compact?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  disabled = false,
  compact = false,
}) => {
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
          <Text
            style={[
              styles.buttonTextDisabled,
              compact && styles.buttonTextDisabledCompact,
            ]}
          >
            录音不可用
          </Text>
        </View>
      );
    }

    switch (recordingState) {
      case "recording":
        return (
          <View style={styles.buttonContent}>
            <StopCircle size={iconSize} color="#fff" />
            <Text style={textStyle}>松开结束</Text>
          </View>
        );

      case "preparing":
        return (
          <View style={styles.buttonContent}>
            <View style={styles.processingIndicator} />
            <Text style={textStyle}>准备中...</Text>
          </View>
        );

      case "canceling":
        return (
          <View style={styles.buttonContent}>
            <Mic size={iconSize} color="#fff" />
            <Text style={[...textStyle, styles.cancelText]}>松开取消</Text>
          </View>
        );

      case "processing":
        return (
          <View style={styles.buttonContent}>
            <View style={styles.processingIndicator} />
            <Text style={textStyle}>处理中...</Text>
          </View>
        );

      case "preview":
        return (
          <View style={styles.buttonContent}>
            <Mic size={iconSize} color="#4CAF50" />
            <Text style={[...textStyle, styles.previewText]}>添加语音</Text>
          </View>
        );

      case "idle":
      default:
        return (
          <View style={styles.buttonContent}>
            <Mic size={iconSize} color="#fff" />
            <Text style={textStyle}>按住说话</Text>
          </View>
        );
    }
  };

  const getButtonStyle = () => {
    const base = compact ? styles.buttonCompact : styles.button;
    if (disabled) {
      return [base, styles.buttonDisabled];
    }
    if (recordingState === "recording") {
      return [base, styles.buttonRecording];
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
    width: 140,
    height: 50,
    backgroundColor: "#6C63FF",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonCompact: {
    width: 118,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
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
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextCompact: {
    fontSize: 14,
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
