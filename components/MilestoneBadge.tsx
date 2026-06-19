/**
 * 里程碑徽章组件
 * 显示用户达到的里程碑等级
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Milestone } from '../types/companionDays';

interface MilestoneBadgeProps {
  milestone: Milestone;
}

export default function MilestoneBadge({ milestone }: MilestoneBadgeProps) {
  const { t } = useTranslation('profile');

  return (
    <View style={[styles.badge, { backgroundColor: milestone.color + '20' }]}>
      <Text style={styles.icon}>{milestone.icon}</Text>
      <Text style={[styles.title, { color: milestone.color }]}>
        {t(`companionDays.milestones.${milestone.days}.title` as 'companionDays.milestones.7.title')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
  },
});
