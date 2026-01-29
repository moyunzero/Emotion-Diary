import { Edit } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DEADLINE_CONFIG, MOOD_CONFIG, MOOD_DESCRIPTIONS } from "../constants";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { styles } from "../styles/components/MoodForm.styles";
import { MoodLevel } from "../types";
import { getMoodIcon } from "../utils/moodIconUtils";
import AppIcon from "./icons/AppIcon";
import TagSelector from "./TagSelector";

interface MoodFormProps {
  // 受控组件的值
  moodLevel: MoodLevel;
  content: string;
  deadline: string;
  isCustomDeadline: boolean;
  customDeadlineText: string;
  selectedPeople: string[];
  selectedTriggers: string[];
  // 自定义标签选项
  customPeopleOptions: string[];
  customTriggerOptions: string[];
  allPeople: string[];
  allTriggers: string[];
  // 回调函数
  onMoodLevelChange: (level: MoodLevel) => void;
  onContentChange: (content: string) => void;
  onDeadlineChange: (deadline: string) => void;
  onCustomDeadlineChange: (isCustom: boolean, text: string) => void;
  onPeopleToggle: (item: string) => void;
  onTriggersToggle: (item: string) => void;
  onAddCustomPerson: (value: string) => Promise<string[]>;
  onAddCustomTrigger: (value: string) => Promise<string[]>;
  onDeleteCustomPerson: (value: string) => Promise<string[]>;
  onDeleteCustomTrigger: (value: string) => Promise<string[]>;
  onSubmit: () => void;
}

/**
 * 情绪记录表单组件
 * 提取 Record 和 EditEntryModal 的公共表单逻辑
 */
const MoodFormComponent: React.FC<MoodFormProps> = ({
  moodLevel,
  content,
  deadline,
  isCustomDeadline,
  customDeadlineText,
  selectedPeople,
  selectedTriggers,
  customPeopleOptions,
  customTriggerOptions,
  allPeople,
  allTriggers,
  onMoodLevelChange,
  onContentChange,
  onDeadlineChange,
  onCustomDeadlineChange,
  onPeopleToggle,
  onTriggersToggle,
  onAddCustomPerson,
  onAddCustomTrigger,
  onDeleteCustomPerson,
  onDeleteCustomTrigger,
  onSubmit,
}) => {
  const { trigger: triggerHaptic } = useHapticFeedback();

  // 情绪等级提示 Modal
  const [moodTipVisible, setMoodTipVisible] = useState(false);
  const [selectedMoodTip, setSelectedMoodTip] = useState<MoodLevel | null>(
    null,
  );

  const handleAddCustomTag = async (
    type: "people" | "trigger",
    value: string,
  ) => {
    if (!value.trim()) return;

    if (type === "people") {
      if (!allPeople.includes(value)) {
        await onAddCustomPerson(value);
      }
      onPeopleToggle(value);
    } else {
      if (!allTriggers.includes(value)) {
        await onAddCustomTrigger(value);
      }
      onTriggersToggle(value);
    }
  };

  const handleDeleteCustomTag = async (
    type: "people" | "trigger",
    value: string,
  ) => {
    Alert.alert("确认删除", `确定要删除标签 "${value}" 吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          if (type === "people") {
            await onDeleteCustomPerson(value);
            // 如果当前选中，取消选中
            if (selectedPeople.includes(value)) {
              onPeopleToggle(value);
            }
          } else {
            await onDeleteCustomTrigger(value);
            // 如果当前选中，取消选中
            if (selectedTriggers.includes(value)) {
              onTriggersToggle(value);
            }
          }
        },
      },
    ]);
  };

  return (
    <>
      {/* 1. Mood Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>此刻的心情是？</Text>
        <View style={styles.moodContainer}>
          {Object.values(MoodLevel)
            .filter((v) => typeof v === "number")
            .map((level) => {
              const config = MOOD_CONFIG[level as MoodLevel];
              const isSelected = moodLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => onMoodLevelChange(level as MoodLevel)}
                  onLongPress={() => {
                    setSelectedMoodTip(level as MoodLevel);
                    setMoodTipVisible(true);
                    triggerHaptic("light");
                  }}
                  style={[
                    styles.moodButton,
                    isSelected && styles.moodButtonSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`选择情绪等级：${config.label}`}
                  accessibilityHint={`点击选择${config.label}，长按查看详细说明`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.moodIconContainer,
                      isSelected && styles.moodIconContainerSelected,
                    ]}
                  >
                    {getMoodIcon(
                      config.iconName,
                      config.iconColor,
                      isSelected ? 36 : 28,
                    )}
                  </View>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && styles.moodLabelSelected,
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>

      {/* 2. Content Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>发生了什么？</Text>
        <TextInput
          value={content}
          onChangeText={onContentChange}
          placeholder="无论是委屈、愤怒还是难过，都可以写下来..."
          multiline
          numberOfLines={4}
          style={styles.contentInput}
          placeholderTextColor="#9CA3AF"
          returnKeyType="default"
          blurOnSubmit={false}
          textAlignVertical="top"
          maxLength={1000}
          accessibilityLabel="情绪内容输入框"
          accessibilityHint="在这里输入你的情绪和感受，描述发生了什么"
        />
      </View>

      {/* 3. Deadline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>打算什么时候聊聊？</Text>
        <View style={styles.deadlineContainer}>
          {Object.entries(DEADLINE_CONFIG).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                onDeadlineChange(key);
                onCustomDeadlineChange(false, "");
              }}
              style={[
                styles.deadlineButton,
                !isCustomDeadline &&
                  deadline === key &&
                  styles.deadlineButtonSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`期限：${config.label}`}
              accessibilityHint={`点击选择${config.label}作为沟通期限`}
              accessibilityState={{
                selected: !isCustomDeadline && deadline === key,
              }}
            >
              <Text
                style={[
                  styles.deadlineText,
                  !isCustomDeadline &&
                    deadline === key &&
                    styles.deadlineTextSelected,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => onCustomDeadlineChange(true, customDeadlineText)}
            style={[
              styles.deadlineButton,
              isCustomDeadline && styles.deadlineButtonSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel="自定义期限"
            accessibilityHint="点击输入自定义的沟通期限"
            accessibilityState={{ selected: isCustomDeadline }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AppIcon name={Edit} size={14} color={isCustomDeadline ? '#FFFFFF' : '#6B7280'} />
              <Text
                style={[
                  styles.deadlineText,
                  isCustomDeadline && styles.deadlineTextSelected,
                ]}
              >
                自定义
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {isCustomDeadline && (
          <TextInput
            value={customDeadlineText}
            onChangeText={(text) => onCustomDeadlineChange(true, text)}
            placeholder="比如：等他主动联系、周末见面时、下个月..."
            style={styles.customDeadlineInput}
            placeholderTextColor="#9CA3AF"
            autoFocus
            returnKeyType="done"
            blurOnSubmit={true}
            maxLength={50}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        )}
      </View>

      {/* 4. People Tags */}
      <TagSelector
        title="和谁有关？（可选）"
        options={allPeople}
        selected={selectedPeople}
        customOptions={customPeopleOptions}
        onToggle={onPeopleToggle}
        onAdd={(val) => handleAddCustomTag("people", val)}
        onDelete={(val) => handleDeleteCustomTag("people", val)}
      />

      {/* 5. Trigger Tags（最后一节，无底边距，由 Record 操作栏统一控制上下间距） */}
      <TagSelector
        title="因为什么？（可选）"
        options={allTriggers}
        selected={selectedTriggers}
        customOptions={customTriggerOptions}
        onToggle={onTriggersToggle}
        onAdd={(val) => handleAddCustomTag("trigger", val)}
        onDelete={(val) => handleDeleteCustomTag("trigger", val)}
        prefix="#"
        isLastSection
      />

      {/* 情绪等级提示 Modal */}
      <Modal
        visible={moodTipVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMoodTipVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMoodTipVisible(false)}
        >
          <View style={styles.moodTipContainer}>
            {selectedMoodTip && (
              <>
                <View style={styles.moodTipIconContainer}>
                  {getMoodIcon(
                    MOOD_CONFIG[selectedMoodTip].iconName,
                    MOOD_CONFIG[selectedMoodTip].iconColor,
                    48,
                  )}
                </View>
                <Text style={styles.moodTipTitle}>
                  {MOOD_CONFIG[selectedMoodTip].label}
                </Text>
                <Text style={styles.moodTipDescription}>
                  {MOOD_DESCRIPTIONS[selectedMoodTip]}
                </Text>
                <TouchableOpacity
                  style={styles.moodTipCloseButton}
                  onPress={() => setMoodTipVisible(false)}
                >
                  <Text style={styles.moodTipCloseText}>知道了</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

/**
 * Helper function to compare arrays for equality
 * Handles null and undefined gracefully
 */
const arraysEqual = (a: string[] | null | undefined, b: string[] | null | undefined): boolean => {
  // Handle null/undefined cases
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

/**
 * Memoization comparison function for MoodForm
 * Performs deep equality checks on array props
 */
const MoodFormComparison = (
  prevProps: MoodFormProps,
  nextProps: MoodFormProps
): boolean => {
  try {
    // Compare primitive values
    if (
      prevProps.moodLevel !== nextProps.moodLevel ||
      prevProps.content !== nextProps.content ||
      prevProps.deadline !== nextProps.deadline ||
      prevProps.isCustomDeadline !== nextProps.isCustomDeadline ||
      prevProps.customDeadlineText !== nextProps.customDeadlineText
    ) {
      return false;
    }

    // Compare arrays with deep equality
    if (
      !arraysEqual(prevProps.selectedPeople, nextProps.selectedPeople) ||
      !arraysEqual(prevProps.selectedTriggers, nextProps.selectedTriggers) ||
      !arraysEqual(prevProps.customPeopleOptions, nextProps.customPeopleOptions) ||
      !arraysEqual(prevProps.customTriggerOptions, nextProps.customTriggerOptions) ||
      !arraysEqual(prevProps.allPeople, nextProps.allPeople) ||
      !arraysEqual(prevProps.allTriggers, nextProps.allTriggers)
    ) {
      return false;
    }

    // Compare callback functions by reference
    // Note: Parent components should use useCallback for these to maintain referential equality
    if (
      prevProps.onMoodLevelChange !== nextProps.onMoodLevelChange ||
      prevProps.onContentChange !== nextProps.onContentChange ||
      prevProps.onDeadlineChange !== nextProps.onDeadlineChange ||
      prevProps.onCustomDeadlineChange !== nextProps.onCustomDeadlineChange ||
      prevProps.onPeopleToggle !== nextProps.onPeopleToggle ||
      prevProps.onTriggersToggle !== nextProps.onTriggersToggle ||
      prevProps.onAddCustomPerson !== nextProps.onAddCustomPerson ||
      prevProps.onAddCustomTrigger !== nextProps.onAddCustomTrigger ||
      prevProps.onDeleteCustomPerson !== nextProps.onDeleteCustomPerson ||
      prevProps.onDeleteCustomTrigger !== nextProps.onDeleteCustomTrigger ||
      prevProps.onSubmit !== nextProps.onSubmit
    ) {
      return false;
    }

    // All props are equal
    return true;
  } catch (error) {
    console.error('MoodForm memo comparison error:', error);
    // On error, assume props are different (safe default - will re-render)
    return false;
  }
};

/**
 * Memoized MoodForm component
 * Prevents unnecessary re-renders when parent state changes don't affect form props
 */
const MoodForm = React.memo(MoodFormComponent, MoodFormComparison);

export default MoodForm;
