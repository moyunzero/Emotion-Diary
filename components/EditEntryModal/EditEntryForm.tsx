/**
 * EditEntryForm: 表单逻辑层
 * 承载 useAppStore updateEntry、useHapticFeedback、所有 useState、useEffect、handleSubmit、自定义标签 load/add/remove
 */
import { Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEADLINE_CONFIG, PEOPLE_OPTIONS, TRIGGER_OPTIONS } from '../../constants';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAppStore } from '../../store/useAppStore';
import { AudioData, MoodEntry, MoodLevel } from '../../types';
import {
  addCustomPerson,
  addCustomTrigger,
  loadCustomOptions,
  removeCustomPerson,
  removeCustomTrigger,
} from '../../utils/customTagsManager';
import AppIcon from '../icons/AppIcon';
import { normalizeDeadline, toggleSelection } from './editEntryUtils';
import EditEntryFields from './EditEntryFields';
import AudioRecorder from '../AudioRecorder/AudioRecorder';
import { styles } from './EditEntryModal.styles';

export interface EditEntryFormProps {
  entry: MoodEntry;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditEntryForm: React.FC<EditEntryFormProps> = ({
  entry,
  visible,
  onClose,
  onSuccess,
}) => {
  const updateEntry = useAppStore((state) => state.updateEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const insets = useSafeAreaInsets();

  const [moodLevel, setMoodLevel] = useState<MoodLevel>(entry.moodLevel);
  const [content, setContent] = useState(entry.content);
  const [deadline, setDeadline] = useState<string>(entry.deadline);
  const [isCustomDeadline, setIsCustomDeadline] = useState(false);
  const [customDeadlineText, setCustomDeadlineText] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(entry.people || []);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(entry.triggers || []);

  const [customPeopleOptions, setCustomPeopleOptions] = useState<string[]>([]);
  const [customTriggerOptions, setCustomTriggerOptions] = useState<string[]>([]);

  const [audios, setAudios] = useState<AudioData[]>(entry.audios || []);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const allPeople = [...PEOPLE_OPTIONS, ...customPeopleOptions];
  const allTriggers = [...TRIGGER_OPTIONS, ...customTriggerOptions];

  useEffect(() => {
    if (visible && entry) {
      const isCustom = !Object.keys(DEADLINE_CONFIG).includes(entry.deadline);
      setMoodLevel(entry.moodLevel);
      setContent(entry.content);
      setDeadline(entry.deadline);
      setIsCustomDeadline(isCustom);
      setCustomDeadlineText(isCustom ? entry.deadline : '');
      setSelectedPeople(entry.people || []);
      setSelectedTriggers(entry.triggers || []);
      setAudios(entry.audios || []);
      setCurrentPlayingId(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
      loadCustomOptionsData();
    }
  }, [visible, entry]);

  const loadCustomOptionsData = async () => {
    const options = await loadCustomOptions();
    setCustomPeopleOptions(options.people);
    setCustomTriggerOptions(options.triggers);
  };

  const handlePlayAudio = useCallback((audio: AudioData) => {
    setCurrentPlayingId(audio.id);
    setIsPlaying(true);
  }, []);

  const handlePauseAudio = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlaybackPositionChange = useCallback((position: number) => {
    setPlaybackPosition(position);
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '写点什么吧，哪怕只是一句话');
      triggerHaptic('warning');
      return;
    }

    Keyboard.dismiss();

    const finalDeadline = normalizeDeadline(isCustomDeadline, customDeadlineText, deadline);

    updateEntry(entry.id, {
      moodLevel,
      content,
      deadline: finalDeadline,
      people: selectedPeople.length ? selectedPeople : ['其他'],
      triggers: selectedTriggers,
      audios,
    });

    triggerHaptic('success');
    onSuccess?.();

    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleDeadlineChange = (key: string) => {
    setDeadline(key);
    setIsCustomDeadline(false);
  };

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <EditEntryFields
        moodLevel={moodLevel}
        onMoodLevelChange={setMoodLevel}
        content={content}
        onContentChange={setContent}
        deadline={deadline}
        onDeadlineChange={handleDeadlineChange}
        isCustomDeadline={isCustomDeadline}
        onCustomDeadlineToggle={() => setIsCustomDeadline(true)}
        customDeadlineText={customDeadlineText}
        onCustomDeadlineTextChange={setCustomDeadlineText}
        selectedPeople={selectedPeople}
        onTogglePerson={(p) => setSelectedPeople((prev) => toggleSelection(prev, p))}
        selectedTriggers={selectedTriggers}
        onToggleTrigger={(t) => setSelectedTriggers((prev) => toggleSelection(prev, t))}
        allPeople={allPeople}
        allTriggers={allTriggers}
        customPeopleOptions={customPeopleOptions}
        customTriggerOptions={customTriggerOptions}
        onAddCustomTag={async (type, value) => {
          if (!value.trim()) return;
          if (type === 'people') {
            if (!allPeople.includes(value)) {
              const newOpts = await addCustomPerson(customPeopleOptions, value);
              setCustomPeopleOptions(newOpts);
            }
            setSelectedPeople((prev) => [...prev, value]);
          } else {
            if (!allTriggers.includes(value)) {
              const newOpts = await addCustomTrigger(customTriggerOptions, value);
              setCustomTriggerOptions(newOpts);
            }
            setSelectedTriggers((prev) => [...prev, value]);
          }
        }}
        onDeleteCustomTag={async (type, value) => {
          Alert.alert('确认删除', `确定要删除标签 "${value}" 吗？`, [
            { text: '取消', style: 'cancel' },
            {
              text: '删除',
              style: 'destructive',
              onPress: async () => {
                if (type === 'people') {
                  const newOpts = await removeCustomPerson(customPeopleOptions, value);
                  setCustomPeopleOptions(newOpts);
                  setSelectedPeople((prev) => prev.filter((p) => p !== value));
                } else {
                  const newOpts = await removeCustomTrigger(customTriggerOptions, value);
                  setCustomTriggerOptions(newOpts);
                  setSelectedTriggers((prev) => prev.filter((t) => t !== value));
                }
              },
            },
          ]);
        }}
      />

      <View style={styles.audioSection}>
        <Text style={styles.audioSectionTitle}>语音附件</Text>
        <AudioRecorder
          audios={audios}
          onAudiosChange={setAudios}
          currentPlayingId={currentPlayingId}
          isPlaying={isPlaying}
          playbackPosition={playbackPosition}
          onPlaybackPositionChange={handlePlaybackPositionChange}
          onPlayAudio={handlePlayAudio}
          onPauseAudio={handlePauseAudio}
        />
      </View>
      </ScrollView>

      <View style={[styles.submitContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!content.trim()}
          style={[styles.submitButton, !content.trim() && styles.submitButtonDisabled]}
        >
          <View style={styles.submitButtonContent}>
            <AppIcon name={Sparkles} size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>保存修改</Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default EditEntryForm;
