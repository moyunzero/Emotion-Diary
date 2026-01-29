import { Droplets, Flower2, Leaf, Sprout } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoodEntry, Status } from '../../types';
import { responsiveBorderRadius, responsiveFontSize, responsiveGrid, responsivePadding, responsiveSpacing } from '../../utils/responsiveUtils';
import { INSIGHTS_COLORS } from './constants';
import { getFlowerPotStatus } from './utils';

interface RelationshipGardenProps {
  entries: MoodEntry[];
}

const RelationshipGardenComponent: React.FC<RelationshipGardenProps> = ({ entries }) => {
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
          <Droplets size={20} color={INSIGHTS_COLORS.accent} />
          <Text style={styles.title}>关系花园</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Sprout size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>还没有种下关系的种子</Text>
          <Text style={styles.emptySubtext}>记录情绪时添加相关的人吧</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Droplets size={20} color={INSIGHTS_COLORS.accent} />
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
                  <Flower2 size={24} color={potStatus.color} />
                ) : potStatus.status === 'growing' ? (
                  <Leaf size={24} color={potStatus.color} />
                ) : (
                  <Droplets size={24} color={potStatus.color} />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: INSIGHTS_COLORS.cardBg,
    marginBottom: responsiveSpacing.cardGap(),
    padding: responsivePadding.card(),
    borderRadius: responsiveBorderRadius.card(),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: responsiveFontSize.cardTitle(16),
    fontWeight: 'bold',
    color: INSIGHTS_COLORS.text,
  },
  subtitle: {
    fontSize: responsiveFontSize.small(12),
    color: INSIGHTS_COLORS.textSecondary,
    marginBottom: responsiveSpacing.component(12),
    marginLeft: 28,
  },
  potsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: responsiveGrid.gap(),
  },
  potItem: {
    alignItems: 'center',
    width: responsiveGrid.itemWidth(responsiveGrid.gap()),
    minWidth: 80,
  },
  pot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  personName: {
    fontSize: responsiveFontSize.body(13),
    fontWeight: 'bold',
    color: INSIGHTS_COLORS.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 3,
  },
  statusText: {
    fontSize: responsiveFontSize.small(10),
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: responsiveFontSize.small(10),
    color: INSIGHTS_COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: responsiveFontSize.body(14),
    color: INSIGHTS_COLORS.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: responsiveFontSize.small(12),
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export const RelationshipGarden = memo(RelationshipGardenComponent);
