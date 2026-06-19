/**
 * 记一笔（新增）与编辑共用：表单 + 语音 + 提交，通过 mode 区分创建 / 编辑。
 * presentation 区分全屏 Tab 页（fullscreen）与 Modal 内嵌（embedded）布局。
 */
import { Sparkles } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { DEADLINE_CONFIG, PEOPLE_KEYS, TRIGGER_KEYS } from "../../constants";
import { resolvePeopleLabel, resolveTriggerLabel } from "@/i18n/resolvePresetLabel";
import { COLORS } from "../../constants/colors";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { createRecordStyles } from "../../styles/components/Record.styles";
import { createSharedStyles } from "../../styles/sharedStyles";
import { useAppStore } from "../../store/useAppStore";
import { AudioData, Deadline, MoodEntry, MoodLevel } from "../../types";
import {
  addCustomPerson,
  addCustomTrigger,
  loadCustomOptions,
  removeCustomPerson,
  removeCustomTrigger,
} from "../../utils/customTagsManager";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type DraftEntry,
} from "../../utils/draftManager";
import { forceCancelRecording } from "../../shared/audio/recordingCoordinator";
import { logger } from "../../utils/logger";
import {
  normalizeCustomDeadline,
  normalizePresetDeadline,
} from "../EditEntryModal/editEntryUtils";
import { AppScreenShell } from "../AppScreenShell";
import { AudioRecorder } from "../AudioRecorder";
import AppIcon from "../icons/AppIcon";
import MoodForm from "../MoodForm";
import { styles as embeddedStyles } from "../EditEntryModal/EditEntryModal.styles";

export type EntryEditorCreateProps = {
  mode: "create";
  presentation: "fullscreen";
  onClose: () => void;
  onSuccess?: () => void;
};

export type EntryEditorEditProps = {
  mode: "edit";
  presentation: "embedded";
  entry: MoodEntry;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export type EntryEditorProps = EntryEditorCreateProps | EntryEditorEditProps;

export function EntryEditor(props: EntryEditorProps) {
  const { t } = useTranslation("record");
  const isCreate = props.mode === "create";
  const editSyncKey =
    props.mode === "edit"
      ? `${props.visible}:${props.entry.id}`
      : "";
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const recordStyles = useMemo(
    () => createRecordStyles(width, height),
    [width, height],
  );
  const { formStyles } = useMemo(
    () => createSharedStyles(width, height),
    [width, height],
  );
  const fullscreenStyles = recordStyles;
  const embedded = props.presentation === "embedded";

  const addEntry = useAppStore((state) => state.addEntry);
  const updateEntry = useAppStore((state) => state.updateEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const scrollViewRef = useRef<ScrollView>(null);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [isInitializing, setIsInitializing] = useState(isCreate);
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(MoodLevel.ANNOYED);
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState<string>(Deadline.TODAY);
  const [isCustomDeadline, setIsCustomDeadline] = useState(false);
  const [customDeadlineText, setCustomDeadlineText] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customPeopleOptions, setCustomPeopleOptions] = useState<string[]>(
    [],
  );
  const [customTriggerOptions, setCustomTriggerOptions] = useState<string[]>(
    [],
  );
  const allPeople = [...PEOPLE_KEYS, ...customPeopleOptions];
  const allTriggers = [...TRIGGER_KEYS, ...customTriggerOptions];

  const [audios, setAudios] = useState<AudioData[]>([]);

  const editVisible = !isCreate ? (props as EntryEditorEditProps).visible : true;

  useEffect(() => {
    if (isCreate || editVisible) return;
    useAppStore.getState().stopAudio();
    void forceCancelRecording();
  }, [isCreate, editVisible]);

  const resetForm = () => {
    useAppStore.getState().stopAudio();
    void forceCancelRecording();
    setMoodLevel(MoodLevel.ANNOYED);
    setContent("");
    setDeadline(Deadline.TODAY);
    setIsCustomDeadline(false);
    setCustomDeadlineText("");
    setSelectedPeople([]);
    setSelectedTriggers([]);
    setAudios([]);
  };

  const loadCustomOptionsData = async () => {
    const options = await loadCustomOptions();
    setCustomPeopleOptions(options.people);
    setCustomTriggerOptions(options.triggers);
  };

  // 创建：首次加载草稿 + 自定义标签
  useEffect(() => {
    if (!isCreate) return;

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
          if (draft.audios && draft.audios.length > 0) {
            setAudios(draft.audios);
          }
        }
      } finally {
        setIsInitializing(false);
      }
    };

    void loadData();
  }, [isCreate]);

  // 编辑：弹层打开且 entry 就绪时同步表单（与原先 EditEntryForm 的 visible+entry 语义对齐）
  useEffect(() => {
    if (isCreate) return;
    const { entry, visible } = props as EntryEditorEditProps;
    if (!visible || !entry) return;

    useAppStore.getState().stopAudio();
    void forceCancelRecording();

    const isCustom = !Object.keys(DEADLINE_CONFIG).includes(entry.deadline);
    setMoodLevel(entry.moodLevel);
    setContent(entry.content);
    setDeadline(entry.deadline);
    setIsCustomDeadline(isCustom);
    setCustomDeadlineText(isCustom ? entry.deadline : "");
    setSelectedPeople(entry.people || []);
    setSelectedTriggers(entry.triggers || []);
    setAudios(entry.audios || []);
    void loadCustomOptionsData();
  }, [isCreate, editSyncKey]); // eslint-disable-line react-hooks/exhaustive-deps -- 仅在打开/换条时从 props 同步 entry

  // 创建：草稿防抖
  useEffect(() => {
    if (!isCreate || isInitializing) return;

    if (
      !content.trim() &&
      selectedPeople.length === 0 &&
      selectedTriggers.length === 0
    ) {
      return;
    }

    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
      draftSaveTimeoutRef.current = null;
    }

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
          audios,
        };
        await saveDraft(draft);
      } catch (error) {
        logger.warn("EntryEditor", "保存草稿失败", error);
      } finally {
        draftSaveTimeoutRef.current = null;
      }
    }, 1000);

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = null;
      }
    };
  }, [
    isCreate,
    isInitializing,
    content,
    selectedPeople,
    selectedTriggers,
    moodLevel,
    deadline,
    customDeadlineText,
    isCustomDeadline,
    audios,
  ]);

  const handleSubmit = async () => {
    if (!content.trim() && audios.length === 0) {
      Alert.alert(
        t("submit.emptyValidation.title"),
        t("submit.emptyValidation.body"),
      );
      triggerHaptic("warning");
      return;
    }

    Keyboard.dismiss();
    useAppStore.getState().stopAudio();
    void forceCancelRecording();

    const finalDeadline = isCustomDeadline
      ? normalizeCustomDeadline(customDeadlineText)
      : normalizePresetDeadline(deadline);

    if (isCreate) {
      addEntry({
        moodLevel,
        content,
        deadline: finalDeadline,
        people: selectedPeople.length ? selectedPeople : ["other"],
        triggers: selectedTriggers,
        audios: audios.length > 0 ? audios : undefined,
      });
      await clearDraft();
    } else {
      const { entry } = props;
      updateEntry(entry.id, {
        moodLevel,
        content,
        deadline: finalDeadline,
        people: selectedPeople.length ? selectedPeople : ["other"],
        triggers: selectedTriggers,
        audios,
      });
    }

    triggerHaptic("success");
    props.onSuccess?.();

    if (isCreate) {
      resetForm();
    }

    const delayMs = isCreate ? 300 : 200;
    setTimeout(() => {
      props.onClose();
    }, delayMs);
  };

  const handlePeopleToggle = (item: string) => {
    setSelectedPeople((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleTriggersToggle = (item: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

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

  const handleDeadlinePreset = (key: string) => {
    setDeadline(key);
    setIsCustomDeadline(false);
    setCustomDeadlineText("");
  };

  const isSubmitDisabled = !content.trim() && audios.length === 0;

  const formInner = (
    <>
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
        onDeadlineChange={handleDeadlinePreset}
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
        compactMode={isCreate}
        getPeopleLabel={resolvePeopleLabel}
        getTriggerLabel={resolveTriggerLabel}
        peopleSectionTitle={t("sections.people.title")}
        triggersSectionTitle={t("sections.triggers.title")}
      />
      <View
        style={
          embedded
            ? embeddedStyles.audioSection
            : fullscreenStyles.audioSection
        }
      >
        {embedded ? (
          <Text style={embeddedStyles.audioSectionTitle}>
            {t("sections.audio.title")}
          </Text>
        ) : null}
        <AudioRecorder
          audios={audios}
          onAudiosChange={setAudios}
          layoutPreset={embedded ? "edit" : "create"}
          clipBinding={
            isCreate ? "tab-focus" : { active: editVisible }
          }
        />
      </View>
    </>
  );

  const submitButtonLabel = isCreate
    ? t("submit.createLabel")
    : t("submit.editLabel");
  const submitAccessibilityLabel = isCreate
    ? t("submit.createA11y")
    : t("submit.editA11y");
  const submitAccessibilityHint = isSubmitDisabled
    ? isCreate
      ? t("submit.createDisabledHint")
      : t("submit.editDisabledHint")
    : isCreate
      ? t("submit.createHint")
      : t("submit.editHint");

  const submitButton = (
    <TouchableOpacity
      testID="mood-submit-button"
      onPress={handleSubmit}
      disabled={isSubmitDisabled}
      style={[
        embedded ? embeddedStyles.submitButton : fullscreenStyles.submitButton,
        isSubmitDisabled &&
          (embedded
            ? embeddedStyles.submitButtonDisabled
            : fullscreenStyles.submitButtonDisabled),
      ]}
      accessibilityRole="button"
      accessibilityLabel={submitAccessibilityLabel}
      accessibilityHint={submitAccessibilityHint}
      accessibilityState={{ disabled: isSubmitDisabled }}
    >
      {embedded ? (
        <View style={embeddedStyles.submitButtonContent}>
          <AppIcon name={Sparkles} size={20} color="#FFFFFF" />
          <Text style={embeddedStyles.submitText}>{submitButtonLabel}</Text>
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            justifyContent: "center",
          }}
        >
          <AppIcon name={Sparkles} size={20} color="#FFFFFF" />
          <Text style={fullscreenStyles.submitText}>{submitButtonLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isCreate && isInitializing) {
    return (
      <AppScreenShell edges={["top", "left", "right"]} showHeader={false}>
        <View style={formStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </AppScreenShell>
    );
  }

  if (embedded) {
    return (
      <>
        <ScrollView
          ref={scrollViewRef}
          style={embeddedStyles.scrollView}
          contentContainerStyle={embeddedStyles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={embeddedStyles.content}>{formInner}</View>
        </ScrollView>
        <View
          style={[
            embeddedStyles.submitContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {submitButton}
        </View>
      </>
    );
  }

  return (
    <AppScreenShell
      edges={["top", "left", "right"]}
      keyboardAware
      style={fullscreenStyles.container}
      title={t("screen.title")}
      onBack={props.onClose}
      backAccessibilityHint={t("screen.backHint")}
      headerStyle={fullscreenStyles.stackHeader}
    >
      <View style={fullscreenStyles.body}>
        <ScrollView
          ref={scrollViewRef}
          style={fullscreenStyles.scrollView}
          contentContainerStyle={fullscreenStyles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={fullscreenStyles.content}>{formInner}</View>
        </ScrollView>
        <View style={fullscreenStyles.submitContainer}>{submitButton}</View>
      </View>
    </AppScreenShell>
  );
}
