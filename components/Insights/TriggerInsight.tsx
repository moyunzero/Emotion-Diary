import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { resolveTriggerAdviceShort, resolveTriggerLabel } from '@/i18n/resolvePresetLabel';
import { Leaf, Sparkles, Sprout } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { getActionLoopDateLine } from '../../shared/entries/actionLoopDateLine';
import { formatLocaleDate } from '../../shared/formatting';
import { useAppStore } from '../../store/useAppStore';
import { COLORS, DESIGN_TOKENS } from '@/constants/colors';
import { MoodEntry } from '../../types';
import { getInsightsColors } from './constants';
import { PrescriptionCard } from './PrescriptionCard';

interface TriggerInsightProps {
  entries: MoodEntry[];
}

const TriggerInsightComponent: React.FC<TriggerInsightProps> = ({ entries }) => {
  const { t } = useTranslation('insights');
  const effectiveLocale = useAppStore((s) => s.effectiveLocale);
  const { padding, fontSize, spacing, borderRadius } = useResponsiveStyles();
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
          shadowColor: COLORS.shadow.primary,
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
        cardsContainer: {
          gap: 12,
        },
        loopContainer: {
          marginTop: 14,
          backgroundColor: insightsColors.bgEnd,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          padding: 12,
          gap: 6,
        },
        loopTitle: {
          fontSize: fontSize.body,
          fontWeight: '700',
          color: insightsColors.accent,
        },
        loopText: {
          fontSize: fontSize.small,
          lineHeight: 18,
          color: insightsColors.text,
        },
        card: {
          backgroundColor: insightsColors.bgStart,
          borderRadius: DESIGN_TOKENS.borderRadius.md,
          padding: 14,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        },
        rankBadge: {
          backgroundColor: insightsColors.primary + '30',
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
          marginRight: 10,
        },
        rankText: {
          fontSize: DESIGN_TOKENS.fontSize.footnote,
          fontWeight: 'bold',
          color: insightsColors.accent,
        },
        triggerName: {
          flex: 1,
          fontSize: fontSize.body,
          fontWeight: 'bold',
          color: insightsColors.text,
        },
        triggerCount: {
          fontSize: fontSize.small,
          color: insightsColors.textSecondary,
        },
        adviceContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          backgroundColor: insightsColors.bgEnd,
          padding: padding.vertical,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
        },
        adviceText: {
          flex: 1,
          fontSize: fontSize.small,
          color: insightsColors.text,
          lineHeight: 18,
        },
        emptyContainer: {
          alignItems: 'center',
          paddingVertical: 24,
        },
        emptyText: {
          fontSize: 14,
          color: insightsColors.textSecondary,
          marginTop: 12,
        },
        emptySubtext: {
          fontSize: 12,
          color: insightsColors.textSecondary,
          marginTop: 4,
        },
        progressContainer: {
          marginTop: 16,
          width: '100%',
          alignItems: 'center',
        },
        progressBar: {
          width: '80%',
          height: 8,
          backgroundColor: COLORS.gray[200],
          borderRadius: DESIGN_TOKENS.borderRadius.full,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressFill: {
          height: '100%',
          backgroundColor: insightsColors.accent,
          borderRadius: DESIGN_TOKENS.borderRadius.full,
        },
        progressText: {
          fontSize: fontSize.small,
          color: insightsColors.textSecondary,
          fontWeight: '600',
        },
      }),
    [padding, fontSize, spacing, borderRadius, insightsColors]
  );

  const triggerData = useMemo(() => {
    const counts: Record<string, { count: number; totalLevel: number }> = {};
    entries.forEach(e => {
      e.triggers.forEach(t => {
        if (!counts[t]) {
          counts[t] = { count: 0, totalLevel: 0 };
        }
        counts[t].count++;
        counts[t].totalLevel += e.moodLevel;
      });
    });
    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgMoodLevel: Math.round((data.totalLevel / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [entries]);

  const actionLoop = useMemo(() => {
    const topTrigger = triggerData[0];
    if (!topTrigger) return null;

    const latestEntry = entries
      .filter((entry) => entry.triggers.includes(topTrigger.name))
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!latestEntry) return null;

    const line = getActionLoopDateLine(latestEntry.timestamp, Date.now());
    const dateText = formatLocaleDate(line.timestamp, effectiveLocale, 'short');

    return {
      trigger: topTrigger.name,
      dateKind: line.kind,
      dateText,
    };
  }, [entries, triggerData, effectiveLocale]);

  if (triggerData.length === 0) {
    const minEntries = 3;
    const currentCount = entries.length;
    const remaining = Math.max(0, minEntries - currentCount);
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Leaf size={20} color={insightsColors.accent} />
          <Text style={styles.title}>{t('triggers.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Sprout size={40} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>
            {remaining > 0 
              ? t('triggers.empty.needMore', { remaining })
              : t('triggers.empty.noData')}
          </Text>
          <Text style={styles.emptySubtext}>{t('triggers.empty.hint')}</Text>
          {remaining > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(currentCount / minEntries) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {t('triggers.empty.progress', { current: currentCount, min: minEntries })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Leaf size={20} color={insightsColors.accent} />
        <Text style={styles.title}>{t('triggers.title')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('triggers.subtitle')}</Text>

      <View style={styles.cardsContainer}>
        {triggerData.map((trigger, index) => (
          <View key={trigger.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.triggerName}>{resolveTriggerLabel(trigger.name)}</Text>
              <Text style={styles.triggerCount}>
                {trigger.count}{t('triggers.countSuffix')}
              </Text>
            </View>
            <View style={styles.adviceContainer}>
              <Sparkles size={14} color={insightsColors.accent} />
              <Text style={styles.adviceText} numberOfLines={3}>
                {resolveTriggerAdviceShort(trigger.name)}
              </Text>
            </View>
            <PrescriptionCard
              trigger={trigger.name}
              moodLevel={Math.min(5, Math.max(1, Math.round(trigger.avgMoodLevel)))}
              entries={entries}
            />
          </View>
        ))}
      </View>

      {actionLoop && (
        <View style={styles.loopContainer}>
          <Text style={styles.loopTitle}>{t('triggers.actionLoop.title')}</Text>
          <Text style={styles.loopText}>
            {t('triggers.actionLoop.stepTrigger', {
              trigger: resolveTriggerLabel(actionLoop.trigger),
            })}
          </Text>
          <Text style={styles.loopText} numberOfLines={2}>
            {t('triggers.actionLoop.stepAction', {
              stepOne: resolveTriggerAdviceShort(actionLoop.trigger),
            })}
          </Text>
          <Text style={styles.loopText}>
            {actionLoop.dateKind === 'revisit'
              ? t('triggers.actionLoop.stepRevisit', { date: actionLoop.dateText })
              : t('triggers.actionLoop.stepRecorded', { date: actionLoop.dateText })}
          </Text>
        </View>
      )}
    </View>
  );
};

export const TriggerInsight = memo(TriggerInsightComponent);
