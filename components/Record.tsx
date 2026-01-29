import { ArrowLeft, Sparkles } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PEOPLE_OPTIONS, TRIGGER_OPTIONS } from "../constants";
import { COLORS } from "../constants/colors";
import { useHapticFeedback } from "../hooks/useHapticFeedback";
import { useAppStore } from "../store/useAppStore";
import { styles } from "../styles/components/Record.styles";
import { formStyles } from "../styles/sharedStyles";
import { Deadline, MoodLevel } from "../types";
import {
  addCustomPerson,
  addCustomTrigger,
  loadCustomOptions,
  removeCustomPerson,
  removeCustomTrigger,
} from "../utils/customTagsManager";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type DraftEntry,
} from "../utils/draftManager";
import AppIcon from "./icons/AppIcon";
import MoodForm from "./MoodForm";

const Record: React.FC<{ onClose: () => void; onSuccess?: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const addEntry = useAppStore((state) => state.addEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const scrollViewRef = useRef<ScrollView>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(MoodLevel.ANNOYED);
  const [content, setContent] = useState("");

  // Deadline State
  const [deadline, setDeadline] = useState<string>(Deadline.TODAY);
  const [isCustomDeadline, setIsCustomDeadline] = useState(false);
  const [customDeadlineText, setCustomDeadlineText] = useState("");

  // Tags State
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  // Custom Tags Options (Persisted in AsyncStorage)
  const [customPeopleOptions, setCustomPeopleOptions] = useState<string[]>([]);
  const [customTriggerOptions, setCustomTriggerOptions] = useState<string[]>(
    [],
  );

  // Combined Options
  const allPeople = [...PEOPLE_OPTIONS, ...customPeopleOptions];
  const allTriggers = [...TRIGGER_OPTIONS, ...customTriggerOptions];

  // 草稿保存防抖定时器
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const resetForm = () => {
    setMoodLevel(MoodLevel.ANNOYED);
    setContent("");
    setDeadline(Deadline.TODAY);
    setIsCustomDeadline(false);
    setCustomDeadlineText("");
    setSelectedPeople([]);
    setSelectedTriggers([]);
  };

  // 当表单内容变化时自动保存草稿（优化：减少依赖项，避免频繁保存）
  useEffect(() => {
    // 只在有实际内容时才保存草稿
    if (
      !content.trim() &&
      selectedPeople.length === 0 &&
      selectedTriggers.length === 0
    ) {
      return;
    }

    // 清除之前的定时器
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
      draftSaveTimeoutRef.current = null;
    }

    // 设置新的定时器，1秒防抖
    draftSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const draft: DraftEntry = {
          moodLevel,
          content,
          deadline,
          customDeadlineText,
          isCustomDeadline,
          selectedPeople,
          selectedTriggers,
        };
        await saveDraft(draft);
      } catch (error) {
        console.error("Failed to save draft:", error);
        // 静默失败，不影响用户体验
      } finally {
        draftSaveTimeoutRef.current = null;
      }
    }, 1000);

    // 清理函数 - 确保在组件卸载时清理定时器
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = null;
      }
    };
  }, [
    content,
    selectedPeople,
    selectedTriggers,
    moodLevel,
    deadline,
    customDeadlineText,
    isCustomDeadline,
  ]);

  // 加载草稿和自定义选项
  useEffect(() => {
    const loadData = async () => {
      setIsInitializing(true);
      try {
        await loadCustomOptionsData();

        const draft = await loadDraft();
        if (draft) {
          setMoodLevel(draft.moodLevel as MoodLevel);
          setContent(draft.content);
          setDeadline(draft.deadline);
          setIsCustomDeadline(draft.isCustomDeadline);
          setCustomDeadlineText(draft.customDeadlineText);
          setSelectedPeople(draft.selectedPeople);
          setSelectedTriggers(draft.selectedTriggers);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    loadData();
  }, []);

  const loadCustomOptionsData = async () => {
    const options = await loadCustomOptions();
    setCustomPeopleOptions(options.people);
    setCustomTriggerOptions(options.triggers);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("提示", "写点什么吧，哪怕只是一句话");
      triggerHaptic("warning");
      return;
    }

    // 关闭键盘
    Keyboard.dismiss();

    const finalDeadline = isCustomDeadline
      ? customDeadlineText.trim() || "未定"
      : deadline;

    addEntry({
      moodLevel,
      content,
      deadline: finalDeadline,
      people: selectedPeople.length ? selectedPeople : ["其他"],
      triggers: selectedTriggers,
    });

    // 清除草稿
    await clearDraft();

    // 触发成功反馈
    triggerHaptic("success");

    // 提交成功后重置表单
    resetForm();

    // 调用成功回调（用于显示Toast）
    onSuccess?.();

    // 延迟关闭，让用户看到反馈
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 标签切换处理
  const handlePeopleToggle = (item: string) => {
    if (selectedPeople.includes(item)) {
      setSelectedPeople(selectedPeople.filter((i) => i !== item));
    } else {
      setSelectedPeople([...selectedPeople, item]);
    }
  };

  const handleTriggersToggle = (item: string) => {
    if (selectedTriggers.includes(item)) {
      setSelectedTriggers(selectedTriggers.filter((i) => i !== item));
    } else {
      setSelectedTriggers([...selectedTriggers, item]);
    }
  };

  // 自定义标签处理
  const handleAddCustomPerson = async (value: string) => {
    const newOpts = await addCustomPerson(customPeopleOptions, value);
    setCustomPeopleOptions(newOpts);
    return newOpts;
  };

  const handleAddCustomTrigger = async (value: string) => {
    const newOpts = await addCustomTrigger(customTriggerOptions, value);
    setCustomTriggerOptions(newOpts);
    return newOpts;
  };

  const handleDeleteCustomPerson = async (value: string) => {
    const newOpts = await removeCustomPerson(customPeopleOptions, value);
    setCustomPeopleOptions(newOpts);
    return newOpts;
  };

  const handleDeleteCustomTrigger = async (value: string) => {
    const newOpts = await removeCustomTrigger(customTriggerOptions, value);
    setCustomTriggerOptions(newOpts);
    return newOpts;
  };

  if (isInitializing) {
    return (
      <SafeAreaView
        style={formStyles.container}
        edges={["top", "left", "right"]}
      >
        <View style={formStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isSubmitDisabled = !content.trim();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="返回"
            accessibilityHint="点击返回上一页"
          >
            <ArrowLeft size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">
            记录这一刻
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.body}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              <MoodForm
                moodLevel={moodLevel}
                content={content}
                deadline={deadline}
                isCustomDeadline={isCustomDeadline}
                customDeadlineText={customDeadlineText}
                selectedPeople={selectedPeople}
                selectedTriggers={selectedTriggers}
                customPeopleOptions={customPeopleOptions}
                customTriggerOptions={customTriggerOptions}
                allPeople={allPeople}
                allTriggers={allTriggers}
                onMoodLevelChange={setMoodLevel}
                onContentChange={setContent}
                onDeadlineChange={setDeadline}
                onCustomDeadlineChange={(isCustom, text) => {
                  setIsCustomDeadline(isCustom);
                  setCustomDeadlineText(text);
                }}
                onPeopleToggle={handlePeopleToggle}
                onTriggersToggle={handleTriggersToggle}
                onAddCustomPerson={handleAddCustomPerson}
                onAddCustomTrigger={handleAddCustomTrigger}
                onDeleteCustomPerson={handleDeleteCustomPerson}
                onDeleteCustomTrigger={handleDeleteCustomTrigger}
                onSubmit={handleSubmit}
              />
            </View>
          </ScrollView>
          {/* 悬浮操作栏：与 TabBar 贴合，无间距 */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="提交情绪记录"
              accessibilityHint={content.trim() ? "点击保存这条情绪记录" : "请先输入情绪内容才能提交"}
              accessibilityState={{ disabled: isSubmitDisabled }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <AppIcon name={Sparkles} size={20} color="#FFFFFF" />
                <Text style={styles.submitText}>记录完成</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Record;
