/**
 * 记一笔（新增）与编辑共用：表单 + 语音 + 提交，通过 mode 区分创建 / 编辑。
 * presentation 区分全屏 Tab 页（fullscreen）与 Modal 内嵌（embedded）布局。
 */
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  DEADLINE_CONFIG,
  SHORTCUT_PEOPLE_KEYS,
  TRIGGER_KEYS,
} from "../../constants";
import { resolvePeopleLabel, resolveTriggerLabel } from "@/i18n/resolvePresetLabel";
import { DESIGN_TOKENS } from "../../constants/colors";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
import { useThemeStyles } from "../../hooks/useThemeStyles";
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
import { excludeSoftDeletedEntries } from "../../shared/entries/visibility";
import { logger } from "../../utils/logger";
import {
  normalizeCustomDeadline,
  normalizePresetDeadline,
} from "../EditEntryModal/editEntryUtils";
import { AppScreenShell } from "../AppScreenShell";
import { AudioRecorder } from "../AudioRecorder";
import MoodForm from "../MoodForm";
import { createEditEntryModalStyles } from "../EditEntryModal/EditEntryModal.styles";
import { AppButton } from "../ui/AppButton";
import {
  getWriteSubmitDisabledReason,
  isWriteSubmitDisabled,
} from "./submitGate";

type EntryEditorCreateProps = {
  mode: "create";
  presentation: "fullscreen";
  onClose: () => void;
  onSuccess?: () => void;
};

type EntryEditorEditProps = {
  mode: "edit";
  presentation: "embedded";
  entry: MoodEntry;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type EntryEditorProps = EntryEditorCreateProps | EntryEditorEditProps;

export function EntryEditor(props: EntryEditorProps) {
  const { t } = useTranslation("record");
  const { t: tOnboarding } = useTranslation("onboarding");
  const isCreate = props.mode === "create";
  const editSyncKey =
    props.mode === "edit"
      ? `${props.visible}:${props.entry.id}`
      : "";
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useThemeStyles();
  const recordStyles = useMemo(
    () => createRecordStyles(width, height, colors),
    [width, height, colors],
  );
  const embeddedStyles = useMemo(
    () => createEditEntryModalStyles(colors),
    [colors],
  );
  const { formStyles } = useMemo(
    () => createSharedStyles(width, height),
    [width, height],
  );
  const fullscreenStyles = recordStyles;
  const embedded = props.presentation === "embedded";

  const addEntry = useAppStore((state) => state.addEntry);
  const updateEntry = useAppStore((state) => state.updateEntry);
  const visibleCount = useAppStore((state) =>
    excludeSoftDeletedEntries(state.entries).length,
  );
  const showFirstEntryHint = isCreate && visibleCount === 0;
  const { trigger: triggerHaptic } = useHapticFeedback();
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  /** Only content-field focus densifies MoodForm — rename keyboard must not collapse sections (jump-to-top). */
  const [contentFieldFocused, setContentFieldFocused] = useState(false);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [isInitializing, setIsInitializing] = useState(isCreate);
  const [moodLevel, setMoodLevel] = useState<MoodLevel | null>(null);
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
  const allPeople = [...SHORTCUT_PEOPLE_KEYS, ...customPeopleOptions];
  const allTriggers = [...TRIGGER_KEYS, ...customTriggerOptions];

  const [audios, setAudios] = useState<AudioData[]>([]);
  /** Mic reveals existing AudioRecorder; hide large chrome until opened (D-04). */
  const [audioSessionVisible, setAudioSessionVisible] = useState(false);
  /** Stay mounted after first Mic open so collapse/keyboard cannot unmount mid-commit (G-25-2). */
  const [audioSessionMounted, setAudioSessionMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (audioSessionVisible) {
      setAudioSessionMounted(true);
    }
  }, [audioSessionVisible]);

  const editVisible = !isCreate ? (props as EntryEditorEditProps).visible : true;

  useEffect(() => {
    if (isCreate || editVisible) return;
    useAppStore.getState().stopAudio();
    void forceCancelRecording();
  }, [isCreate, editVisible]);

  // Pin sticky submit to keyboard top via measured height (create + edit).
  // Avoid KeyboardAvoidingView — it leaves a hollow gap above the keyboard.
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
      setKeyboardHeight(0);
    };
  }, []);

  const resetForm = () => {
    useAppStore.getState().stopAudio();
    void forceCancelRecording();
    setMoodLevel(null);
    setContent("");
    setDeadline(Deadline.TODAY);
    setIsCustomDeadline(false);
    setCustomDeadlineText("");
    setSelectedPeople([]);
    setSelectedTriggers([]);
    setAudios([]);
    setAudioSessionVisible(false);
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
          setMoodLevel(
            draft.moodLevel === null || draft.moodLevel === undefined
              ? null
              : (draft.moodLevel as MoodLevel),
          );
          setContent(draft.content);
          setDeadline(draft.deadline);
          setIsCustomDeadline(draft.isCustomDeadline);
          setCustomDeadlineText(draft.customDeadlineText);
          setSelectedPeople(draft.selectedPeople);
          setSelectedTriggers(draft.selectedTriggers);
          if (draft.audios && draft.audios.length > 0) {
            setAudios(draft.audios);
            setAudioSessionVisible(true);
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
    const entryAudios = entry.audios || [];
    setAudios(entryAudios);
    setAudioSessionVisible(entryAudios.length > 0);
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
    if (isSubmitting) return;
    const gateInput = { moodLevel, content, audios };
    if (isWriteSubmitDisabled(gateInput) || moodLevel === null) {
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
    setIsSubmitting(true);

    try {
      const finalDeadline = isCustomDeadline
        ? normalizeCustomDeadline(customDeadlineText)
        : normalizePresetDeadline(deadline);

      if (isCreate) {
        addEntry({
          moodLevel,
          content,
          deadline: finalDeadline,
          people: selectedPeople,
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
          people: selectedPeople,
          triggers: selectedTriggers,
          audios,
        });
      }

      triggerHaptic("success");
      props.onSuccess?.();

      if (isCreate) {
        // D-06: clear form and stay on Write Tab — no navigational onClose
        resetForm();
      } else {
        setTimeout(() => {
          props.onClose();
        }, 200);
      }
    } catch (error) {
      // Re-enable for retry (UI-SPEC: no guilt copy; button returns enabled)
      logger.warn("EntryEditor", "提交失败，可再试一次", error);
    } finally {
      // Tab stays mounted — must clear loading or 「收好中…」sticks after success
      setIsSubmitting(false);
    }
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

  const submitGateInput = { moodLevel, content, audios };
  const isSubmitDisabled = isWriteSubmitDisabled(submitGateInput);
  const submitGateReason = getWriteSubmitDisabledReason(submitGateInput);
  const keyboardOpen = keyboardHeight > 0;

  const handleContentFocus = useCallback(() => {
    setContentFieldFocused(true);
    // Let keyboard animate, then bring「发生了什么？」above sticky submit.
    // Do not run this for audio rename — that would scroll to page top then fight
    // the focused clip (Voice Memos-style: keep scroll, only pad for keyboard).
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: embedded ? 72 : 0,
          animated: true,
        });
      }, 80);
    });
  }, [embedded]);

  const handleContentBlur = useCallback(() => {
    setContentFieldFocused(false);
  }, []);

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
        compactMode
        denseSections={embedded || contentFieldFocused}
        onContentFocus={handleContentFocus}
        onContentBlur={handleContentBlur}
        onMicPress={() => setAudioSessionVisible((v) => !v)}
        micActive={audioSessionVisible}
        showFirstEntryHint={showFirstEntryHint}
        contentPlaceholder={
          showFirstEntryHint
            ? tOnboarding("firstEntry.placeholder")
            : undefined
        }
        getPeopleLabel={resolvePeopleLabel}
        getTriggerLabel={resolveTriggerLabel}
        peopleSectionTitle={t("sections.people.title")}
        triggersSectionTitle={t("sections.triggers.title")}
      />
      {/* Mic reveals session; keep AudioRecorder mounted — hide chrome only (D-04 / G-25-2).
          G-25-3: do not AND keyboardOpen — rename TextInput needs interactive chrome. */}
      {audioSessionMounted ? (
        <View
          style={[
            embedded
              ? embeddedStyles.audioSection
              : fullscreenStyles.audioSection,
            !audioSessionVisible
              ? {
                  height: 0,
                  opacity: 0,
                  overflow: "hidden" as const,
                  marginTop: 0,
                  marginBottom: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  pointerEvents: "none" as const,
                }
              : null,
          ]}
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
      ) : null}
    </>
  );

  const submitButtonLabel = isCreate
    ? t("submit.createLabel")
    : t("submit.editLabel");
  const submitLoadingLabel = isCreate
    ? t("submit.createLoadingLabel")
    : t("submit.editLabel");
  const submitAccessibilityLabel = isCreate
    ? t("submit.createA11y")
    : t("submit.editA11y");
  const submitDisabledReason = (() => {
    if (!isSubmitDisabled) return undefined;
    if (!isCreate) return t("submit.editDisabledHint");
    if (submitGateReason === "mood") {
      return t("submit.createDisabledMoodHint");
    }
    return t("submit.createDisabledHint");
  })();
  const submitAccessibilityHint = isSubmitDisabled
    ? submitDisabledReason
    : isCreate
      ? t("submit.createHint")
      : t("submit.editHint");

  const submitButton = (
    <AppButton
      variant="primary"
      label={submitButtonLabel}
      loadingLabel={submitLoadingLabel}
      loading={isSubmitting}
      disabled={isSubmitDisabled}
      disabledReason={submitDisabledReason}
      onPress={() => {
        void handleSubmit();
      }}
      testID="mood-submit-button"
      accessibilityLabel={submitAccessibilityLabel}
      accessibilityHint={submitAccessibilityHint}
    />
  );

  if (isCreate && isInitializing) {
    return (
      <AppScreenShell edges={["top", "left", "right"]} showHeader={false}>
        <View style={formStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreenShell>
    );
  }

  if (embedded) {
    return (
      <View
        style={[
          embeddedStyles.embeddedRoot,
          keyboardOpen ? { paddingBottom: keyboardHeight } : null,
        ]}
      >
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
            {
              // Keyboard frame already includes home-indicator; don't stack insets.
              paddingBottom: keyboardOpen
                ? DESIGN_TOKENS.spacing.sm
                : Math.max(insets.bottom, 16),
            },
          ]}
        >
          {submitButton}
        </View>
      </View>
    );
  }

  return (
    <EntryEditorFullscreen
      scrollViewRef={scrollViewRef}
      fullscreenStyles={fullscreenStyles}
      formInner={formInner}
      submitButton={submitButton}
      title={t("screen.title")}
      onClose={props.onClose}
      backAccessibilityHint={t("screen.backHint")}
      keyboardHeight={keyboardHeight}
    />
  );
}

function EntryEditorFullscreen({
  scrollViewRef,
  fullscreenStyles,
  formInner,
  submitButton,
  title,
  onClose,
  backAccessibilityHint,
  keyboardHeight,
}: {
  scrollViewRef: React.RefObject<ScrollView | null>;
  fullscreenStyles: ReturnType<typeof createRecordStyles>;
  formInner: React.ReactNode;
  submitButton: React.ReactNode;
  title: string;
  onClose: () => void;
  backAccessibilityHint: string;
  keyboardHeight: number;
}) {
  const tabBarHeight = useBottomTabBarHeight();
  const keyboardOpen = keyboardHeight > 0;
  const scrollPad = keyboardOpen
    ? DESIGN_TOKENS.spacing.xl
    : DESIGN_TOKENS.spacing.xxxl * 3 + tabBarHeight;

  return (
    <AppScreenShell
      edges={["top", "left", "right"]}
      keyboardAware={false}
      style={fullscreenStyles.container}
      title={title}
      onBack={onClose}
      backAccessibilityHint={backAccessibilityHint}
      headerStyle={fullscreenStyles.stackHeader}
    >
      <View
        style={[
          fullscreenStyles.body,
          keyboardOpen ? { paddingBottom: keyboardHeight } : null,
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={fullscreenStyles.scrollView}
          contentContainerStyle={[
            fullscreenStyles.scrollViewContent,
            { flexGrow: 0, paddingBottom: scrollPad },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={fullscreenStyles.content}>{formInner}</View>
        </ScrollView>
        <View
          style={[
            fullscreenStyles.submitContainer,
            {
              // Keyboard open: sit on keyboard top. Closed: sit above tab bar.
              bottom: keyboardOpen ? 0 : tabBarHeight,
              paddingBottom: keyboardOpen
                ? DESIGN_TOKENS.spacing.sm
                : DESIGN_TOKENS.spacing.xl,
            },
          ]}
        >
          {submitButton}
        </View>
      </View>
    </AppScreenShell>
  );
}
