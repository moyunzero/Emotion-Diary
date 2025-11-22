import { CheckCircle, Flame, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DEADLINE_CONFIG, MOOD_CONFIG } from '../constants';
import { useApp } from '../context/AppContext';
import { Deadline, MoodEntry, MoodLevel, Status } from '../types';

interface Props {
  entry: MoodEntry;
  onBurn?: (text: string) => void;
}

const EntryCard: React.FC<Props> = ({ entry, onBurn }) => {
  const { resolveEntry, deleteEntry } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const isResolved = entry.status === Status.RESOLVED;
  
  const moodConfig = MOOD_CONFIG[entry.moodLevel];
  
  // Handle custom deadlines that might not be in the config
  const deadlineLabel = DEADLINE_CONFIG[entry.deadline as Deadline]?.label || entry.deadline;

  const getMoodColor = () => {
    switch (entry.moodLevel) {
      case MoodLevel.ANNOYED:
        return '#FEF3C7';
      case MoodLevel.UPSET:
        return '#FED7AA';
      case MoodLevel.ANGRY:
        return '#FEE2E2';
      case MoodLevel.FURIOUS:
        return '#FECACA';
      case MoodLevel.EXPLOSIVE:
        return '#FCA5A5';
      default:
        return '#FEF3C7';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Animated.View style={[styles.container, isResolved && styles.resolvedContainer]}>
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
        <View style={styles.content}>
          {/* Emoji Badge */}
          <View style={[styles.emojiBadge, { backgroundColor: getMoodColor() }]}>
            <Text style={styles.emojiText}>{moodConfig.emoji}</Text>
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <View style={styles.header}>
              <Text style={styles.peopleText} numberOfLines={1}>
                {entry.people.join(', ')}
              </Text>
              <Text style={styles.dateText}>
                {formatDate(entry.timestamp)}
              </Text>
            </View>
            <Text style={styles.contentText} numberOfLines={2}>
              {entry.content}
            </Text>
            
            {/* Tags */}
            <View style={styles.tagsContainer}>
              <View style={styles.deadlineTag}>
                <Text style={styles.deadlineText}>{deadlineLabel}</Text>
              </View>
              {entry.triggers.map((t, index) => (
                <View key={index} style={styles.triggerTag}>
                  <Text style={styles.triggerText}>#{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Actions */}
      {isExpanded && !isResolved && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => resolveEntry(entry.id)}
          >
            <View style={styles.actionIcon}>
              <CheckCircle size={20} color="#10B981" />
            </View>
            <Text style={styles.actionText}>和解打卡</Text>
          </TouchableOpacity>

          {onBurn && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onBurn(entry.content)}
            >
              <View style={styles.actionIcon}>
                <Flame size={20} color="#F97316" />
              </View>
              <Text style={styles.actionText}>气话焚烧</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => deleteEntry(entry.id)}
          >
            <View style={styles.actionIcon}>
              <Trash2 size={20} color="#9CA3AF" />
            </View>
            <Text style={styles.actionText}>删除</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resolvedContainer: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  emojiText: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  peopleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  contentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deadlineTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deadlineText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  triggerTag: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  triggerText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
});

export default EntryCard;
