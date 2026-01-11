import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEADLINE_CONFIG, MOOD_CONFIG, PEOPLE_OPTIONS, TRIGGER_OPTIONS } from '../constants';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useAppStore } from '../store/useAppStore';
import { MoodEntry, MoodLevel } from '../types';
import { getMoodIcon } from '../utils/moodIconUtils';

interface EditEntryModalProps {
  entry: MoodEntry;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, visible, onClose, onSuccess }) => {
  const updateEntry = useAppStore((state) => state.updateEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  
  const [moodLevel, setMoodLevel] = useState<MoodLevel>(entry.moodLevel);
  const [content, setContent] = useState(entry.content);
  const [deadline, setDeadline] = useState<string>(entry.deadline);
  const [isCustomDeadline, setIsCustomDeadline] = useState(false);
  const [customDeadlineText, setCustomDeadlineText] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(entry.people);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(entry.triggers);
  
  // Custom Tags Options
  const [customPeopleOptions, setCustomPeopleOptions] = useState<string[]>([]);
  const [customTriggerOptions, setCustomTriggerOptions] = useState<string[]>([]);

  const allPeople = [...PEOPLE_OPTIONS, ...customPeopleOptions];
  const allTriggers = [...TRIGGER_OPTIONS, ...customTriggerOptions];

  // 初始化表单数据
  useEffect(() => {
    if (visible && entry) {
      const isCustom = !Object.keys(DEADLINE_CONFIG).includes(entry.deadline);
      setMoodLevel(entry.moodLevel);
      setContent(entry.content);
      setDeadline(entry.deadline);
      setIsCustomDeadline(isCustom);
      setCustomDeadlineText(isCustom ? entry.deadline : '');
      setSelectedPeople(entry.people);
      setSelectedTriggers(entry.triggers);
      loadCustomOptions();
    }
  }, [visible, entry]);

  const loadCustomOptions = async () => {
    try {
      const people = await AsyncStorage.getItem('custom_people');
      const triggers = await AsyncStorage.getItem('custom_triggers');
      if (people) setCustomPeopleOptions(JSON.parse(people));
      if (triggers) setCustomTriggerOptions(JSON.parse(triggers));
    } catch (error) {
      console.error('Error loading custom options:', error);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '写点什么吧，哪怕只是一句话 💙');
      triggerHaptic('warning');
      return;
    }
    
    const finalDeadline = isCustomDeadline ? (customDeadlineText.trim() || '未定') : deadline;

    updateEntry(entry.id, {
      moodLevel,
      content,
      deadline: finalDeadline,
      people: selectedPeople.length ? selectedPeople : ['其他'],
      triggers: selectedTriggers,
    });
    
    triggerHaptic('success');
    onSuccess?.();
    onClose();
  };

  const toggleSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleAddCustomTag = async (type: 'people' | 'trigger', value: string) => {
    if (!value.trim()) return;
    
    if (type === 'people') {
      if (!allPeople.includes(value)) {
        const newOpts = [...customPeopleOptions, value];
        setCustomPeopleOptions(newOpts);
        await AsyncStorage.setItem('custom_people', JSON.stringify(newOpts));
      }
      setSelectedPeople(prev => [...prev, value]);
    } else {
      if (!allTriggers.includes(value)) {
        const newOpts = [...customTriggerOptions, value];
        setCustomTriggerOptions(newOpts);
        await AsyncStorage.setItem('custom_triggers', JSON.stringify(newOpts));
      }
      setSelectedTriggers(prev => [...prev, value]);
    }
  };

  const handleDeleteCustomTag = async (type: 'people' | 'trigger', value: string) => {
    Alert.alert(
      '确认删除',
      `确定要删除标签 "${value}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            if (type === 'people') {
              const newOpts = customPeopleOptions.filter(o => o !== value);
              setCustomPeopleOptions(newOpts);
              await AsyncStorage.setItem('custom_people', JSON.stringify(newOpts));
              setSelectedPeople(prev => prev.filter(p => p !== value));
            } else {
              const newOpts = customTriggerOptions.filter(o => o !== value);
              setCustomTriggerOptions(newOpts);
              await AsyncStorage.setItem('custom_triggers', JSON.stringify(newOpts));
              setSelectedTriggers(prev => prev.filter(t => t !== value));
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header with SafeArea */}
        <View style={styles.headerWrapper}>
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>编辑记录 ✏️</Text>
              <View style={styles.placeholder} /> 
            </View>
          </SafeAreaView>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

            <View style={styles.content}>
              {/* 1. Mood Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>此刻的心情是？</Text>
                <View style={styles.moodContainer}>
                  {Object.values(MoodLevel).filter(v => typeof v === 'number').map((level) => {
                    const config = MOOD_CONFIG[level as MoodLevel];
                    const isSelected = moodLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setMoodLevel(level as MoodLevel)}
                        style={[styles.moodButton, isSelected && styles.moodButtonSelected]}
                      >
                        <View style={[styles.moodIconContainer, isSelected && styles.moodIconContainerSelected]}>
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

              {/* 2. Content Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>发生了什么？</Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="无论是委屈、愤怒还是难过，都可以写下来..."
                  multiline
                  numberOfLines={4}
                  style={styles.contentInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* 3. Deadline */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>打算什么时候聊聊？</Text>
                <View style={styles.deadlineContainer}>
                  {Object.entries(DEADLINE_CONFIG).map(([key, config]) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => { setDeadline(key); setIsCustomDeadline(false); }}
                      style={[
                        styles.deadlineButton,
                        !isCustomDeadline && deadline === key && styles.deadlineButtonSelected
                      ]}
                    >
                      <Text style={[
                        styles.deadlineText,
                        !isCustomDeadline && deadline === key && styles.deadlineTextSelected
                      ]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity
                    onPress={() => setIsCustomDeadline(true)}
                    style={[
                      styles.deadlineButton,
                      isCustomDeadline && styles.deadlineButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.deadlineText,
                      isCustomDeadline && styles.deadlineTextSelected
                    ]}>
                      ✎ 自定义
                    </Text>
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
                  />
                )}
              </View>

              {/* 4. People Tags */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>和谁有关？（可选）</Text>
                <View style={styles.tagsContainer}>
                  {allPeople.map(p => {
                    const isSelected = selectedPeople.includes(p);
                    const isCustom = customPeopleOptions.includes(p);
                    return (
                      <View key={p} style={[styles.tag, isSelected && styles.tagSelected]}>
                        <TouchableOpacity
                          onPress={() => toggleSelection(selectedPeople, setSelectedPeople, p)}
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

              {/* 5. Trigger Tags */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>因为什么？（可选）</Text>
                <View style={styles.tagsContainer}>
                  {allTriggers.map(t => {
                    const isSelected = selectedTriggers.includes(t);
                    const isCustom = customTriggerOptions.includes(t);
                    return (
                      <View key={t} style={[styles.tag, isSelected && styles.tagSelected]}>
                        <TouchableOpacity
                          onPress={() => toggleSelection(selectedTriggers, setSelectedTriggers, t)}
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

          {/* Submit Button */}
          <SafeAreaView edges={['bottom']} style={styles.submitSafeArea}>
            <View style={styles.submitContainer}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!content.trim()}
                style={[styles.submitButton, !content.trim() && styles.submitButtonDisabled]}
              >
                <Text style={styles.submitText}>保存修改 💫</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// AddTagInput component
const AddTagInput: React.FC<{ onAdd: (val: string) => void }> = ({ onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState('');

  if (isEditing) {
    return (
      <View style={styles.addTagInputContainer}>
        <TextInput
          autoFocus
          value={val}
          onChangeText={setVal}
          onBlur={() => { if (val) onAdd(val); setIsEditing(false); setVal(''); }}
          onSubmitEditing={() => { if (val) onAdd(val); setIsEditing(false); setVal(''); }}
          placeholder="添加新标签..."
          style={styles.addTagInput}
        />
        <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.addTagCancel}>
          <X size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={() => setIsEditing(true)}
      style={styles.addTagButton}
    >
      <Plus size={12} color="#6B7280" />
      <Text style={styles.addTagText}>自定义</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  moodButton: {
    alignItems: 'center',
    opacity: 0.5,
  },
  moodButtonSelected: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  moodIconContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodIconContainerSelected: {},
  moodLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B5563',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: '#1F2937',
    fontWeight: '800',
  },
  contentInput: {
    width: '100%',
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#374151',
    textAlignVertical: 'top',
  },
  deadlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  deadlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  deadlineButtonSelected: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  deadlineTextSelected: {
    color: '#FFFFFF',
  },
  customDeadlineInput: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tagSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  tagMain: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  tagTextSelected: {
    color: '#EF4444',
  },
  tagDelete: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    opacity: 0.6,
  },
  addTagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTagInput: {
    width: 80,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
  },
  addTagCancel: {
    padding: 4,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  submitSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  submitContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default EditEntryModal;

