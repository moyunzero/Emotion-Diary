/**
 * 陪伴天数详情弹窗组件
 * 显示陪伴天数、开始日期、当前里程碑和下一个里程碑
 */

import { PartyPopper, X } from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    calculateDays,
    formatStartDate,
    getDaysToNextMilestone,
    getMilestone,
    getNextMilestone,
} from '../services/companionDaysService';
import { useAppStore } from '../store/useAppStore';
import AppIcon from './icons/AppIcon';
import MilestoneIcon from './icons/MilestoneIcon';

interface CompanionDaysModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CompanionDaysModal({ visible, onClose }: CompanionDaysModalProps) {
  const user = useAppStore(state => state.user);
  
  const days = calculateDays(user?.firstEntryDate);
  const milestone = getMilestone(days);
  const nextMilestone = getNextMilestone(days);
  const daysToNext = getDaysToNextMilestone(days);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>陪伴天数</Text>
            
            <View style={styles.daysContainer}>
              <Text style={styles.daysValue}>{days}</Text>
              <Text style={styles.daysLabel}>天</Text>
            </View>
            
            {user?.firstEntryDate && (
              <Text style={styles.startDate}>
                开始于 {formatStartDate(user.firstEntryDate)}
              </Text>
            )}
            
            {milestone && (
              <View style={styles.milestoneSection}>
                <Text style={styles.sectionTitle}>当前成就</Text>
                <View style={[styles.milestoneCard, { borderColor: milestone.color }]}>
                  <MilestoneIcon 
                    emoji={milestone.icon} 
                    size={32} 
                    color={milestone.color}
                    testID="current-milestone-icon"
                  />
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                </View>
              </View>
            )}
            
            {nextMilestone ? (
              <View style={styles.nextSection}>
                <Text style={styles.sectionTitle}>下一个里程碑</Text>
                <View style={styles.nextCard}>
                  <MilestoneIcon 
                    emoji={nextMilestone.icon} 
                    size={28} 
                    color="#6B7280"
                    testID="next-milestone-icon"
                  />
                  <Text style={styles.nextTitle}>{nextMilestone.title}</Text>
                  <Text style={styles.nextDays}>还需 {daysToNext} 天</Text>
                </View>
              </View>
            ) : (
              <View style={styles.maxSection}>
                <View style={styles.maxContent}>
                  <AppIcon name={PartyPopper} size={20} color="#EF4444" testID="max-achievement-icon" />
                  <Text style={styles.maxText}>恭喜！您已达到最高成就！</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  daysValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#EF4444',
  },
  daysLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  startDate: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  milestoneSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  milestoneCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    marginTop: 8,
  },
  milestoneDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  nextSection: {
    marginTop: 20,
  },
  nextCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    marginTop: 8,
  },
  nextDays: {
    fontSize: 14,
    color: '#6B7280',
  },
  maxSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  maxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  maxText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
