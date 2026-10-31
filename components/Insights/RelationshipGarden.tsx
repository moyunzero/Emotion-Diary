import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { useThemeStyles } from '@/hooks/useThemeStyles';
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
import { DESIGN_TOKENS } from '@/constants/colors';
import { MoodEntry } from '../../types';
import { AppButton } from '../ui/AppButton';
import { getInsightsColors } from './constants';
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
  const { colors } = useThemeStyles();
  const insightsColors = useMemo(
    () => getInsightsColors(colors),
    [colors],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: insightsColors.cardBg,
          marginBottom: spacing.cardGap,
          padding: padding.card,
          borderRadius: borderRadius.card,
          shadowColor: colors.shadow.primary,
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
          color: insightsColors.text,
        },
        subtitle: {
          fontSize: fontSize.small,
          color: insightsColors.textSecondary,
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
          backgroundColor: insightsColors.needWaterColor + '14',
        },
        pot: {
          width: 56,
          height: 56,
          borderRadius: DESIGN_TOKENS.borderRadius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        },
        personName: {
          fontSize: fontSize.body,
          fontWeight: 'bold',
          color: insightsColors.text,
          marginBottom: 3,
          textAlign: 'center',
        },
        statusBadge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
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
        emptyContainer: {
          alignItems: 'center',
          paddingVertical: 24,
        },
        emptyText: {
          fontSize: fontSize.body,
          color: insightsColors.textSecondary,
          marginTop: 12,
        },
        emptySubtext: {
          fontSize: fontSize.small,
          color: colors.gray[400],
          marginTop: 4,
        },
        emptyCtaWrap: {
          marginTop: 12,
          alignSelf: 'stretch',
        },
      }),
    [colors, padding, fontSize, spacing, borderRadius, layout, insightsColors]
  );

  // Phase 13 helpers — soft-delete / person contract; sort by latest activity (D-21)
  const relationshipData = useMemo(() => {
    return listDistinctPeople(entries)
      .map((name) => {
        const agg = aggregateForPerson(entries, name);
        return {
          name,
          resolveRate: agg.resolveRate,
          latestTimestamp: agg.latestTimestamp,
        };
      })
      .sort(
        (a, b) => (b.latestTimestamp ?? 0) - (a.latestTimestamp ?? 0),
      )
      .slice(0, 5);
  }, [entries]);

  const potPalette = useMemo(
    () => ({
      bloomingColor: insightsColors.bloomingColor,
      growingColor: insightsColors.growingColor,
      needWaterColor: insightsColors.needWaterColor,
    }),
    [insightsColors],
  );

  if (relationshipData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Droplets size={20} color={insightsColors.accent} />
          <Text style={styles.title}>{t('relationship.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Sprout size={40} color={colors.gray[300]} />
          <Text style={styles.emptyText}>{t('relationship.empty.title')}</Text>
          <Text style={styles.emptySubtext}>{t('relationship.empty.hint')}</Text>
          <View style={styles.emptyCtaWrap}>
            <AppButton
              variant="primary"
              label={t('relationship.empty.cta')}
              onPress={() => router.push('/record')}
              accessibilityLabel={t('relationship.empty.ctaA11y')}
              testID="relationship-garden-empty-cta"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Droplets size={20} color={insightsColors.accent} />
        <Text style={styles.title}>{t('relationship.title')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('relationship.subtitle')}</Text>
      
      <View style={styles.potsContainer}>
        {relationshipData.map((person) => {
          const potStatus = getFlowerPotStatus(person.resolveRate, potPalette, t);
          const displayName = resolvePeopleLabel(person.name);
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
              )}
              accessibilityHint={t('relationship.potA11yHint', { name: displayName })}
              testID={`relationship-garden-pot-${person.name}`}
            >
              {/* 花盆图标 — resolveRate drives growth visual only (D-20) */}
              <View style={[styles.pot, { backgroundColor: potStatus.color + '30' }]}>
                {renderPotIcon(potStatus.status, potStatus.color)}
              </View>
              {/* 人名 */}
              <Text style={styles.personName} numberOfLines={1}>
                {displayName}
              </Text>
              {/* 生长态标签（无 X/Y 和解 — D-20） */}
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const RelationshipGarden = memo(RelationshipGardenComponent);
