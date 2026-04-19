/**
 * 录音按钮组件
 * 支持按住说话、滑动取消、误触保护
 */

import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Mic, MicOff, StopCircle } from "lucide-react-native";
import { RecordingState } from "../../store/modules/audio";

const CANCEL_THRESHOLD_PX = 30;
const PRESS_DURATION_THRESHOLD_MS = 300;

interface RecordButtonProps {
  recordingState: RecordingState;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onRecordingCancel: () => void;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  recordingState,
  onRecordingStart,
  onRecordingStop,
  onRecordingCancel,
  disabled = false,
}) => {
  const pressStartTimeRef = useRef<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const slideOffsetY = useRef(new Animated.Value(0)).current;

  const handleStartRecording = useCallback(() => {
    if (disabled) return;
    
    pressStartTimeRef.current = Date.now();
    setIsPressed(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRecordingStart();
  }, [disabled, onRecordingStart]);

  const handleStopRecording = useCallback(() => {
    if (!pressStartTimeRef.current) return;
    
    const pressDuration = Date.now() - pressStartTimeRef.current;
    
    if (pressDuration < PRESS_DURATION_THRESHOLD_MS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onRecordingCancel();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRecordingStop();
    }
    
    pressStartTimeRef.current = null;
    setIsPressed(false);
    slideOffsetY.setValue(0);
  }, [onRecordingStop, onRecordingCancel, slideOffsetY]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    if (recordingState === 'idle' || recordingState === 'preview') {
      handleStartRecording();
    }
  }, [disabled, recordingState, handleStartRecording]);

  const handlePressOut = useCallback(() => {
    if (recordingState === 'recording') {
      handleStopRecording();
    }
  }, [recordingState, handleStopRecording]);

  const handleCancelRecording = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    onRecordingCancel();
    pressStartTimeRef.current = null;
    setIsPressed(false);
    slideOffsetY.setValue(0);
  };

  const renderButtonContent = () => {
    if (disabled) {
      return (
        <View style={styles.buttonContent}>
          <MicOff size={24} color="#999" />
          <Text style={styles.buttonTextDisabled}>录音不可用</Text>
        </View>
      );
    }

    switch (recordingState) {
      case 'idle':
        return (
          <View style={styles.buttonContent}>
            <Mic size={24} color="#fff" />
            <Text style={styles.buttonText}>按住说话</Text>
          </View>
        );

      case 'recording':
        return (
          <View style={styles.buttonContent}>
            <StopCircle size={24} color="#fff" />
            <Text style={styles.buttonText}>松开结束</Text>
          </View>
        );

      case 'canceling':
        return (
          <View style={styles.buttonContent}>
            <Mic size={24} color="#fff" />
            <Text style={[styles.buttonText, styles.cancelText]}>松开取消</Text>
          </View>
        );

      case 'processing':
        return (
          <View style={styles.buttonContent}>
            <View style={styles.processingIndicator} />
            <Text style={styles.buttonText}>处理中...</Text>
          </View>
        );

      case 'preview':
        return (
          <View style={styles.buttonContent}>
            <Mic size={24} color="#4CAF50" />
            <Text style={[styles.buttonText, styles.previewText]}>添加语音</Text>
          </View>
        );

      default:
        return (
          <View style={styles.buttonContent}>
            <Mic size={24} color="#fff" />
            <Text style={styles.buttonText}>按住说话</Text>
          </View>
        );
    }
  };

  const getButtonStyle = () => {
    if (disabled) {
      return [styles.button, styles.buttonDisabled];
    }
    if (recordingState === 'recording') {
      return [styles.button, styles.buttonRecording];
    }
    if (recordingState === 'preview') {
      return [styles.button, styles.buttonPreview];
    }
    return [styles.button];
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
  buttonTextDisabled: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
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

export default RecordButton;
