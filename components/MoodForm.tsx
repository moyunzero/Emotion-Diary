/**
 * 情绪记录表单：受控组件，由 EntryEditor（记一笔 / 编辑）传入状态与 onSubmit。
 * 负责等级、正文、期限、人物与触发器标签等录入体验，不包含路由与持久化细节。
 */

import { Edit } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { DEADLINE_CONFIG, MOOD_CONFIG } from "../constants";
import { getDeadlineLabel, getMoodDescription, getMoodLabel } from "@/i18n/moodLabels";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { createMoodFormStyles } from "../styles/components/MoodForm.styles";
import { useTranslation } from "react-i18next";
import { MoodLevel } from "../types";
import { areOrderedStringArraysEqual } from "../utils/arrayEquality";
import { getMoodIcon } from "../utils/moodIconUtils";
import AppIcon from "./icons/AppIcon";
import TagSelector from "./TagSelector";

const MOOD_LEVEL_VALUES = Object.values(MoodLevel).filter(
  (v) => typeof v === "number",
) as MoodLevel[];

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
  /** 创建流默认折叠人物/触发器/期限，降低记录门槛（A4） */
  compactMode?: boolean;
  getPeopleLabel?: (item: string) => string;
  getTriggerLabel?: (item: string) => string;
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
  compactMode = false,
  getPeopleLabel = (item) => item,
  getTriggerLabel = (item) => item,
}) => {
  // 提交与校验由父组件 onSubmit 统一处理（写 store、关弹窗等）；此处仅在用户完成表单操作后触发回调。
  // 自定义标签经 handleAddCustomTag / handleDeleteCustomTag 与持久化层同步，再反映到 props 中的选项列表。

  const { width, height } = useWindowDimensions();
  const styles = useMemo(
    () => createMoodFormStyles(width, height),
    [width, height]
  );
  const { trigger: triggerHaptic } = useHapticFeedback();
  const { t: tRetention } = useTranslation("retention");
  const { t: tRecord } = useTranslation("record");
  const { t: tCommon } = useTranslation("common");

  // 情绪等级提示 Modal
  const [moodTipVisible, setMoodTipVisible] = useState(false);
  const [selectedMoodTip, setSelectedMoodTip] = useState<MoodLevel | null>(
    null,
  );
  const [showAdvanced, setShowAdvanced] = useState(!compactMode);

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
    Alert.alert(
      tRecord("alerts.deleteTag.title"),
      tRecord("alerts.deleteTag.message", { tag: value }),
      [
      { text: tCommon("actions.cancel"), style: "cancel" },
      {
        text: tRecord("alerts.deleteTag.confirm"),
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
    ],
    );
  };

  return (
    <>
      {/* 1. Mood Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{tRecord("sections.mood.title")}</Text>
        <View style={styles.moodContainer}>
          {MOOD_LEVEL_VALUES.map((level) => {
              const config = MOOD_CONFIG[level as MoodLevel];
              const moodLabel = getMoodLabel(level as MoodLevel);
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
                  accessibilityLabel={tRecord("moodSelector.accessibilityLabel", {
                    label: moodLabel,
                  })}
                  accessibilityHint={tRecord("moodSelector.accessibilityHint", {
                    label: moodLabel,
                  })}
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
                    {moodLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>

      {/* 2. Content Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {tRecord("sections.content.title")}
        </Text>
        <TextInput
          testID="mood-content-input"
          value={content}
          onChangeText={onContentChange}
          placeholder={tRecord("sections.content.placeholder")}
          multiline
          numberOfLines={4}
          style={styles.contentInput}
          placeholderTextColor="#9CA3AF"
          returnKeyType="default"
          blurOnSubmit={false}
          textAlignVertical="top"
          maxLength={1000}
          accessibilityLabel={tRecord("sections.content.accessibilityLabel")}
          accessibilityHint={tRecord("sections.content.accessibilityHint")}
        />
      </View>

      {compactMode && !showAdvanced ? (
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(true)}
          accessibilityRole="button"
          accessibilityLabel={tRecord("advanced.expandA11y")}
        >
          <Text style={styles.advancedToggleText}>
            {tRetention("quickForm.expand")}
          </Text>
        </TouchableOpacity>
      ) : null}

      {showAdvanced ? (
        <>
      {/* 3. Deadline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {tRecord("sections.deadline.title")}
        </Text>
        <View style={styles.deadlineContainer}>
          {Object.entries(DEADLINE_CONFIG).map(([key, config]) => {
            const deadlineLabel = getDeadlineLabel(key);
            return (
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
              accessibilityLabel={tRecord("deadlineSelector.accessibilityLabel", {
                label: deadlineLabel,
              })}
              accessibilityHint={tRecord("deadlineSelector.accessibilityHint", {
                label: deadlineLabel,
              })}
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
                {deadlineLabel}
              </Text>
            </TouchableOpacity>
          );
          })}

          <TouchableOpacity
            onPress={() => onCustomDeadlineChange(true, customDeadlineText)}
            style={[
              styles.deadlineButton,
              isCustomDeadline && styles.deadlineButtonSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={tRecord("customDeadline.accessibilityLabel")}
            accessibilityHint={tRecord("customDeadline.accessibilityHint")}
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
                {tRecord("customDeadline.button")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {isCustomDeadline && (
          <TextInput
            value={customDeadlineText}
            onChangeText={(text) => onCustomDeadlineChange(true, text)}
            placeholder={tRecord("customDeadline.placeholder")}
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
        title={tRecord("sections.people.title")}
        options={allPeople}
        selected={selectedPeople}
        customOptions={customPeopleOptions}
        onToggle={onPeopleToggle}
        onAdd={(val) => handleAddCustomTag("people", val)}
        onDelete={(val) => handleDeleteCustomTag("people", val)}
        getLabel={getPeopleLabel}
      />

      {/* 5. Trigger Tags（最后一节，无底边距，由 Record 操作栏统一控制上下间距） */}
      <TagSelector
        title={tRecord("sections.triggers.title")}
        options={allTriggers}
        selected={selectedTriggers}
        customOptions={customTriggerOptions}
        onToggle={onTriggersToggle}
        onAdd={(val) => handleAddCustomTag("trigger", val)}
        onDelete={(val) => handleDeleteCustomTag("trigger", val)}
        prefix="#"
        isLastSection
        getLabel={getTriggerLabel}
      />
        </>
      ) : null}

      {compactMode && showAdvanced ? (
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(false)}
          accessibilityRole="button"
          accessibilityLabel={tRecord("advanced.collapseA11y")}
        >
          <Text style={styles.advancedToggleText}>
            {tRetention("quickForm.collapse")}
          </Text>
        </TouchableOpacity>
      ) : null}

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
                  {getMoodLabel(selectedMoodTip)}
                </Text>
                <Text style={styles.moodTipDescription}>
                  {getMoodDescription(selectedMoodTip)}
                </Text>
                <TouchableOpacity
                  style={styles.moodTipCloseButton}
                  onPress={() => setMoodTipVisible(false)}
                >
                  <Text style={styles.moodTipCloseText}>
                    {tRecord("moodTip.close")}
                  </Text>
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
      !areOrderedStringArraysEqual(
        prevProps.selectedPeople,
        nextProps.selectedPeople,
      ) ||
      !areOrderedStringArraysEqual(
        prevProps.selectedTriggers,
        nextProps.selectedTriggers,
      ) ||
      !areOrderedStringArraysEqual(
        prevProps.customPeopleOptions,
        nextProps.customPeopleOptions,
      ) ||
      !areOrderedStringArraysEqual(
        prevProps.customTriggerOptions,
        nextProps.customTriggerOptions,
      ) ||
      !areOrderedStringArraysEqual(prevProps.allPeople, nextProps.allPeople) ||
      !areOrderedStringArraysEqual(prevProps.allTriggers, nextProps.allTriggers)
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
      prevProps.onSubmit !== nextProps.onSubmit ||
      prevProps.compactMode !== nextProps.compactMode ||
      prevProps.getPeopleLabel !== nextProps.getPeopleLabel ||
      prevProps.getTriggerLabel !== nextProps.getTriggerLabel
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
