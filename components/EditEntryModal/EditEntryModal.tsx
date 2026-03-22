import { Edit, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEADLINE_CONFIG, MOOD_CONFIG, PEOPLE_OPTIONS, TRIGGER_OPTIONS } from '../../constants';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { useAppStore } from '../../store/useAppStore';
import { MoodEntry, MoodLevel } from '../../types';
import {
  addCustomPerson,
  addCustomTrigger,
  loadCustomOptions,
  removeCustomPerson,
  removeCustomTrigger,
} from '../../utils/customTagsManager';
import { getMoodIcon } from '../../utils/moodIconUtils';
import AddTagInput from '../AddTagInput';
import AppIcon from '../icons/AppIcon';
import type { EditEntryModalProps } from '../../types/components';
import { normalizeDeadline, toggleSelection } from './editEntryUtils';
import { styles } from './EditEntryModal.styles';

const EditEntryModalComponent: React.FC<EditEntryModalProps> = ({
  entry,
  visible,
  onClose,
  onSuccess,
}) => {
  const updateEntry = useAppStore((state) => state.updateEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [moodLevel, setMoodLevel] = useState<MoodLevel>(entry.moodLevel);
  const [content, setContent] = useState(entry.content);
  const [deadline, setDeadline] = useState<string>(entry.deadline);
  const [isCustomDeadline, setIsCustomDeadline] = useState(false);
  const [customDeadlineText, setCustomDeadlineText] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(entry.people || []);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(entry.triggers || []);

  const [customPeopleOptions, setCustomPeopleOptions] = useState<string[]>([]);
  const [customTriggerOptions, setCustomTriggerOptions] = useState<string[]>([]);

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
      loadCustomOptionsData();
    }
  }, [visible, entry]);

  const loadCustomOptionsData = async () => {
    const options = await loadCustomOptions();
    setCustomPeopleOptions(options.people);
    setCustomTriggerOptions(options.triggers);
  };

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
    });

    triggerHaptic('success');
    onSuccess?.();

    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleTogglePerson = (person: string) => {
    setSelectedPeople((prev) => toggleSelection(prev, person));
  };

  const handleToggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) => toggleSelection(prev, trigger));
  };

  const handleAddCustomTag = async (type: 'people' | 'trigger', value: string) => {
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
  };

  const handleDeleteCustomTag = async (type: 'people' | 'trigger', value: string) => {
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
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <AppIcon name={Edit} size={20} color="#1F2937" />
              <Text style={styles.headerTitle}>编辑记录</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>此刻的心情是？</Text>
                <View style={styles.moodContainer}>
                  {Object.values(MoodLevel)
                    .filter((v) => typeof v === 'number')
                    .map((level) => {
                      const config = MOOD_CONFIG[level as MoodLevel];
                      const isSelected = moodLevel === level;
                      return (
                        <TouchableOpacity
                          key={level}
                          onPress={() => setMoodLevel(level as MoodLevel)}
                          style={[styles.moodButton, isSelected && styles.moodButtonSelected]}
                        >
                          <View
                            style={[
                              styles.moodIconContainer,
                              isSelected && styles.moodIconContainerSelected,
                            ]}
                          >
                            {getMoodIcon(config.iconName, config.iconColor, isSelected ? 36 : 28)}
                          </View>
                          <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                            {config.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>发生了什么？</Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="把这一刻写给焚语，哪怕只是一句心里话..."
                  multiline
                  numberOfLines={4}
                  style={styles.contentInput}
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="default"
                  blurOnSubmit={false}
                  textAlignVertical="top"
                  maxLength={1000}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>打算什么时候聊聊？</Text>
                <View style={styles.deadlineContainer}>
                  {Object.entries(DEADLINE_CONFIG).map(([key, config]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => {
                        setDeadline(key);
                        setIsCustomDeadline(false);
                      }}
                      style={[
                        styles.deadlineButton,
                        !isCustomDeadline && deadline === key && styles.deadlineButtonSelected,
                      ]}
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
                    onPress={() => setIsCustomDeadline(true)}
                    style={[
                      styles.deadlineButton,
                      isCustomDeadline && styles.deadlineButtonSelected,
                    ]}
                  >
                    <View style={styles.deadlineCustomContainer}>
                      <AppIcon
                        name={Edit}
                        size={14}
                        color={isCustomDeadline ? '#FFFFFF' : '#6B7280'}
                      />
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
                    onChangeText={setCustomDeadlineText}
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

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>和谁有关？（可选）</Text>
                <View style={styles.tagsContainer}>
                  {allPeople.map((p) => {
                    const isSelected = selectedPeople.includes(p);
                    const isCustom = customPeopleOptions.includes(p);
                    return (
                      <View key={p} style={[styles.tag, isSelected && styles.tagSelected]}>
                        <TouchableOpacity
                          onPress={() => handleTogglePerson(p)}
                          style={styles.tagMain}
                        >
                          <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                        {isCustom && (
                          <TouchableOpacity
                            onPress={() => handleDeleteCustomTag('people', p)}
                            style={styles.tagDelete}
                          >
                            <X size={12} color="#6B7280" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                  <AddTagInput onAdd={(val) => handleAddCustomTag('people', val)} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>因为什么？（可选）</Text>
                <View style={styles.tagsContainer}>
                  {allTriggers.map((t) => {
                    const isSelected = selectedTriggers.includes(t);
                    const isCustom = customTriggerOptions.includes(t);
                    return (
                      <View key={t} style={[styles.tag, isSelected && styles.tagSelected]}>
                        <TouchableOpacity
                          onPress={() => handleToggleTrigger(t)}
                          style={styles.tagMain}
                        >
                          <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                            #{t}
                          </Text>
                        </TouchableOpacity>
                        {isCustom && (
                          <TouchableOpacity
                            onPress={() => handleDeleteCustomTag('trigger', t)}
                            style={styles.tagDelete}
                          >
                            <X size={12} color="#6B7280" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                  <AddTagInput onAdd={(val) => handleAddCustomTag('trigger', val)} />
                </View>
              </View>
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const EditEntryModal = React.memo(EditEntryModalComponent);

export default EditEntryModal;
