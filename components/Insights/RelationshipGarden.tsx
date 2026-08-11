import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { resolvePeopleLabel } from '@/i18n/resolvePresetLabel';
import {
  aggregateForPerson,
  listDistinctPeople,
} from '@/shared/entries/personQueries';
import { type Href, useRouter } from 'expo-router';
import { Droplets, Flower2, Leaf, Sprout } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MoodEntry } from '../../types';
import { INSIGHTS_COLORS } from './constants';
import { getFlowerPotStatus } from './utils';
import { buildRelationshipPotA11yLabel } from './relationshipPotA11y';

interface RelationshipGardenProps {
  readonly entries: MoodEntry[];
}

// 辅助函数：根据状态渲染对应的图标
const renderPotIcon = (status: string, color: string) => {
  switch (status) {
    case 'blooming':
      return <Flower2 size={24} color={color} />;
    case 'growing':
      return <Leaf size={24} color={color} />;
    default:
      return <Droplets size={24} color={color} />;
  }
};

const RelationshipGardenComponent: React.FC<RelationshipGardenProps> = ({ entries }) => {
  const { t } = useTranslation('insights');
  const router = useRouter();
  const { padding, fontSize, spacing, borderRadius, layout } = useResponsiveStyles();
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
          gap: 8,
          marginBottom: 4,
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
          marginLeft: 28,
        },
        potsContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: layout.gridGap + 4,
        },
        potItem: {
          alignItems: 'center',
          width: '48%',
          minWidth: 120,
          minHeight: 44,
          borderRadius: borderRadius.card,
          paddingVertical: 4,
        },
        potItemPressed: {
          backgroundColor: INSIGHTS_COLORS.needWaterColor + '14',
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
          fontSize: fontSize.body,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
          marginBottom: 3,
          textAlign: 'center',
        },
        statusBadge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 10,
          marginBottom: 3,
          maxWidth: '100%',
          alignSelf: 'stretch',
          alignItems: 'center',
        },
        statusText: {
          fontSize: fontSize.small - 1,
          fontWeight: 'bold',
          textAlign: 'center',
        },
        statsText: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
        },
        emptyContainer: {
          alignItems: 'center',
          paddingVertical: 24,
        },
        emptyText: {
          fontSize: fontSize.body,
          color: INSIGHTS_COLORS.textSecondary,
          marginTop: 12,
        },
        emptySubtext: {
          fontSize: fontSize.small,
          color: '#9CA3AF',
          marginTop: 4,
        },
        emptyCta: {
          marginTop: 12,
          minHeight: 44,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 14,
          backgroundColor: INSIGHTS_COLORS.needWaterColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyCtaPressed: {
          opacity: 0.85,
        },
        emptyCtaText: {
          fontSize: fontSize.body,
          fontWeight: '700',
          color: '#FFFFFF',
        },
      }),
    [padding, fontSize, spacing, borderRadius, layout]
  );

  // Phase 13 helpers — same soft-delete / status / person contract as timeline header (D-06)
  const relationshipData = useMemo(() => {
    return listDistinctPeople(entries)
      .map((name) => {
        const agg = aggregateForPerson(entries, name);
        return {
          name,
          total: agg.entryCount,
          resolved: agg.resolvedCount,
          resolveRate: agg.resolveRate,
        };
      })
      .sort((a, b) => a.resolveRate - b.resolveRate) // 需要关注的排前面
      .slice(0, 5);
  }, [entries]);

  if (relationshipData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Droplets size={20} color={INSIGHTS_COLORS.accent} />
          <Text style={styles.title}>{t('relationship.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Sprout size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>{t('relationship.empty.title')}</Text>
          <Text style={styles.emptySubtext}>{t('relationship.empty.hint')}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.emptyCta,
              pressed && styles.emptyCtaPressed,
            ]}
            onPress={() => router.push('/record')}
            accessibilityRole="button"
            accessibilityLabel={t('relationship.empty.ctaA11y')}
            testID="relationship-garden-empty-cta"
          >
            <Text style={styles.emptyCtaText}>{t('relationship.empty.cta')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Droplets size={20} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>{t('relationship.title')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('relationship.subtitle')}</Text>
      
      <View style={styles.potsContainer}>
        {relationshipData.map((person) => {
          const potStatus = getFlowerPotStatus(person.resolveRate, {
            bloomingColor: INSIGHTS_COLORS.bloomingColor,
            growingColor: INSIGHTS_COLORS.growingColor,
            needWaterColor: INSIGHTS_COLORS.needWaterColor,
          }, t);
          const displayName = resolvePeopleLabel(person.name);
          const healedCountText = t('relationship.healedCount', {
            resolved: person.resolved,
            total: person.total,
          });
          return (
            <Pressable
              key={person.name}
              style={({ pressed }) => [
                styles.potItem,
                pressed && styles.potItemPressed,
              ]}
              onPress={() =>
                // Typed routes lag until Metro regenerates .expo/types (gitignored)
                router.push({
                  pathname: '/person-timeline',
                  params: { person: person.name },
                } as unknown as Href)
              }
              accessibilityRole="button"
              accessibilityLabel={buildRelationshipPotA11yLabel(
                displayName,
                potStatus.label,
                healedCountText,
              )}
              accessibilityHint={t('relationship.potA11yHint', { name: displayName })}
              testID={`relationship-garden-pot-${person.name}`}
            >
              {/* 花盆图标 */}
              <View style={[styles.pot, { backgroundColor: potStatus.color + '30' }]}>
                {renderPotIcon(potStatus.status, potStatus.color)}
              </View>
              {/* 人名 */}
              <Text style={styles.personName} numberOfLines={1}>
                {displayName}
              </Text>
              {/* 状态标签 */}
              <View style={[styles.statusBadge, { backgroundColor: potStatus.color + '20' }]}>
                <Text
                  style={[styles.statusText, { color: potStatus.color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {potStatus.label}
                </Text>
              </View>
              {/* 统计 */}
              <Text style={styles.statsText} numberOfLines={1}>
                {healedCountText}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const RelationshipGarden = memo(RelationshipGardenComponent);
