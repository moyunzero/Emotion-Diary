/**
 * EditEntryFields: 纯视图层，无 store 订阅
 * 接收 Form 下发的 value/onChange 与标签列表，负责 MOOD_CONFIG、deadline、人/触发器、AddTagInput 等展示与受控输入
 */
import { Edit, X } from 'lucide-react-native';
import React from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DEADLINE_CONFIG, MOOD_CONFIG } from '../../constants';
import { MoodLevel } from '../../types';
import { getMoodIcon } from '../../utils/moodIconUtils';
import AddTagInput from '../AddTagInput';
import AppIcon from '../icons/AppIcon';
import { styles } from './EditEntryModal.styles';

export interface EditEntryFieldsProps {
  moodLevel: MoodLevel;
  onMoodLevelChange: (level: MoodLevel) => void;
  content: string;
  onContentChange: (text: string) => void;
  deadline: string;
  onDeadlineChange: (key: string) => void;
  isCustomDeadline: boolean;
  onCustomDeadlineToggle: () => void;
  customDeadlineText: string;
  onCustomDeadlineTextChange: (text: string) => void;
  selectedPeople: string[];
  onTogglePerson: (person: string) => void;
  selectedTriggers: string[];
  onToggleTrigger: (trigger: string) => void;
  allPeople: string[];
  allTriggers: string[];
  customPeopleOptions: string[];
  customTriggerOptions: string[];
  onAddCustomTag: (type: 'people' | 'trigger', value: string) => void;
  onDeleteCustomTag: (type: 'people' | 'trigger', value: string) => void;
}

const EditEntryFields: React.FC<EditEntryFieldsProps> = ({
  moodLevel,
  onMoodLevelChange,
  content,
  onContentChange,
  deadline,
  onDeadlineChange,
  isCustomDeadline,
  onCustomDeadlineToggle,
  customDeadlineText,
  onCustomDeadlineTextChange,
  selectedPeople,
  onTogglePerson,
  selectedTriggers,
  onToggleTrigger,
  allPeople,
  allTriggers,
  customPeopleOptions,
  customTriggerOptions,
  onAddCustomTag,
  onDeleteCustomTag,
}) => {
  return (
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
                  onPress={() => onMoodLevelChange(level as MoodLevel)}
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
        <TextInput
          value={content}
          onChangeText={onContentChange}
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
              onPress={() => onDeadlineChange(key)}
              style={[
                styles.deadlineButton,
                !isCustomDeadline && deadline === key && styles.deadlineButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.deadlineText,
                  !isCustomDeadline && deadline === key && styles.deadlineTextSelected,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={onCustomDeadlineToggle}
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
            onChangeText={onCustomDeadlineTextChange}
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
                <TouchableOpacity onPress={() => onTogglePerson(p)} style={styles.tagMain}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                    {p}
                  </Text>
                </TouchableOpacity>
                {isCustom && (
                  <TouchableOpacity
                    onPress={() => onDeleteCustomTag('people', p)}
                    style={styles.tagDelete}
                  >
                    <X size={12} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <AddTagInput onAdd={(val) => onAddCustomTag('people', val)} />
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
                <TouchableOpacity onPress={() => onToggleTrigger(t)} style={styles.tagMain}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                    #{t}
                  </Text>
                </TouchableOpacity>
                {isCustom && (
                  <TouchableOpacity
                    onPress={() => onDeleteCustomTag('trigger', t)}
                    style={styles.tagDelete}
                  >
                    <X size={12} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <AddTagInput onAdd={(val) => onAddCustomTag('trigger', val)} />
        </View>
      </View>
    </View>
  );
};

export default EditEntryFields;
