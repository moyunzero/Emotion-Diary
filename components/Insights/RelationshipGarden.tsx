import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { MoodEntry, Status } from '../../types';
import { INSIGHTS_COLORS } from './constants';
import { getFlowerPotStatus } from './utils';
import AppIcon from '../icons/AppIcon';

interface RelationshipGardenProps {
  entries: MoodEntry[];
}

const RelationshipGardenComponent: React.FC<RelationshipGardenProps> = ({ entries }) => {
  const { padding, fontSize, spacing, borderRadius, layout } = useResponsiveStyles();
  
  // 响应式计算花盆尺寸
  const potSize = useMemo(() => {
    const base = 48;
    return layout.maxContentWidth > 600 ? 56 : base;
  }, [layout.maxContentWidth]);
  
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: INSIGHTS_COLORS.cardBg,
          marginBottom: spacing.cardGap,
          padding: padding.card,
          borderRadius: borderRadius.card,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        },
        title: {
          fontSize: fontSize.cardTitle,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
        },
        subtitle: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
          marginBottom: spacing.component,
          marginLeft: spacing.cardGap + spacing.sm,
        },
        potsContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: layout.gridGap,
        },
        potItem: {
          alignItems: 'center',
          width: layout.gridItemWidth,
          minWidth: 80,
        },
        pot: {
          width: potSize,
          height: potSize,
          borderRadius: potSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm - 2,
        },
        personName: {
          fontSize: fontSize.body,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
          marginBottom: spacing.xs - 1,
          textAlign: 'center',
        },
        statusBadge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.large,
          marginBottom: spacing.xs - 1,
        },
        statusText: {
          fontSize: fontSize.small,
          fontWeight: 'bold',
        },
        statsText: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
        },
        emptyContainer: {
          alignItems: 'center',
          paddingVertical: spacing.cardGap,
        },
        emptyText: {
          fontSize: fontSize.body,
          color: INSIGHTS_COLORS.textSecondary,
          marginTop: spacing.sm + 4,
        },
        emptySubtext: {
          fontSize: fontSize.small,
          color: '#9CA3AF',
          marginTop: spacing.xs,
        },
      }),
    [padding, fontSize, spacing, borderRadius, layout, potSize]
  );

  // 计算每个人的关系健康度
  const relationshipData = useMemo(() => {
    const peopleStats: Record<string, { total: number; resolved: number }> = {};
    
    entries.forEach(e => {
      e.people.forEach(p => {
        if (!peopleStats[p]) {
          peopleStats[p] = { total: 0, resolved: 0 };
        }
        peopleStats[p].total++;
        if (e.status === Status.RESOLVED) {
          peopleStats[p].resolved++;
        }
      });
    });

    return Object.entries(peopleStats)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        resolved: stats.resolved,
        resolveRate: stats.total > 0 ? stats.resolved / stats.total : 0,
      }))
      .sort((a, b) => a.resolveRate - b.resolveRate) // 需要关注的排前面
      .slice(0, 5);
  }, [entries]);

  if (relationshipData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <AppIcon name="Droplets" size={20} color={INSIGHTS_COLORS.accent} />
          <Text style={styles.title}>关系花园</Text>
        </View>
        <View style={styles.emptyContainer}>
          <AppIcon name="Sprout" size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>还没有种下关系的种子</Text>
          <Text style={styles.emptySubtext}>记录情绪时添加相关的人吧</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppIcon name="Droplets" size={20} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>关系花园</Text>
      </View>
      <Text style={styles.subtitle}>这些关系需要你的关注</Text>
      
      <View style={styles.potsContainer}>
        {relationshipData.map((person) => {
          const potStatus = getFlowerPotStatus(person.resolveRate, {
            bloomingColor: INSIGHTS_COLORS.bloomingColor,
            growingColor: INSIGHTS_COLORS.growingColor,
            needWaterColor: INSIGHTS_COLORS.needWaterColor,
          });
          return (
            <View key={person.name} style={styles.potItem}>
              {/* 花盆图标 */}
              <View style={[styles.pot, { backgroundColor: potStatus.color + '30' }]}>
                {potStatus.status === 'blooming' ? (
                  <AppIcon name="Flower2" size={24} color={potStatus.color} />
                ) : potStatus.status === 'growing' ? (
                  <AppIcon name="Leaf" size={24} color={potStatus.color} />
                ) : (
                  <AppIcon name="Droplets" size={24} color={potStatus.color} />
                )}
              </View>
              {/* 人名 */}
              <Text style={styles.personName} numberOfLines={1}>
                {person.name}
              </Text>
              {/* 状态标签 */}
              <View style={[styles.statusBadge, { backgroundColor: potStatus.color + '20' }]}>
                <Text style={[styles.statusText, { color: potStatus.color }]}>
                  {potStatus.label}
                </Text>
              </View>
              {/* 统计 */}
              <Text style={styles.statsText}>
                {person.resolved}/{person.total} 已治愈
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const RelationshipGarden = memo(RelationshipGardenComponent);
