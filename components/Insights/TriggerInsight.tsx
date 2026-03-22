import { Leaf, Sparkles, Sprout } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { formatMonthDay } from '../../shared/formatting';
import { MoodEntry, MoodLevel } from '../../types';
import { INSIGHTS_COLORS, TRIGGER_ADVICE } from './constants';
import { PrescriptionCard } from './PrescriptionCard';

interface TriggerInsightProps {
  entries: MoodEntry[];
}

const TriggerInsightComponent: React.FC<TriggerInsightProps> = ({ entries }) => {
  const { padding, fontSize, spacing, borderRadius } = useResponsiveStyles();
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
        cardsContainer: {
          gap: 12,
        },
        loopContainer: {
          marginTop: 14,
          backgroundColor: '#EFF6FF',
          borderRadius: 10,
          padding: 12,
          gap: 6,
        },
        loopTitle: {
          fontSize: fontSize.body,
          fontWeight: '700',
          color: '#1D4ED8',
        },
        loopText: {
          fontSize: fontSize.small,
          lineHeight: 18,
          color: '#1E3A8A',
        },
        card: {
          backgroundColor: '#FAFAFA',
          borderRadius: 12,
          padding: 14,
        },
        cardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        },
        rankBadge: {
          backgroundColor: INSIGHTS_COLORS.primary + '30',
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
          marginRight: 10,
        },
        rankText: {
          fontSize: 11,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.accent,
        },
        triggerName: {
          flex: 1,
          fontSize: fontSize.body,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
        },
        triggerCount: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
        },
        adviceContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          backgroundColor: '#F0FDF4',
          padding: padding.vertical,
          borderRadius: 8,
        },
        adviceText: {
          flex: 1,
          fontSize: fontSize.small,
          color: '#166534',
          lineHeight: 18,
        },
        emptyContainer: {
          alignItems: 'center',
          paddingVertical: 24,
        },
        emptyText: {
          fontSize: 14,
          color: INSIGHTS_COLORS.textSecondary,
          marginTop: 12,
        },
        emptySubtext: {
          fontSize: 12,
          color: '#9CA3AF',
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
          backgroundColor: '#E5E7EB',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 8,
        },
        progressFill: {
          height: '100%',
          backgroundColor: INSIGHTS_COLORS.secondary,
          borderRadius: 4,
        },
        progressText: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
          fontWeight: '600',
        },
      }),
    [padding, fontSize, spacing, borderRadius]
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

    const revisitTime = latestEntry.timestamp + 48 * 60 * 60 * 1000;
    const revisitText = formatMonthDay(revisitTime);

    return {
      trigger: topTrigger.name,
      revisitText,
      stepOne: TRIGGER_ADVICE[topTrigger.name] || TRIGGER_ADVICE["其他"],
    };
  }, [entries, triggerData]);

  if (triggerData.length === 0) {
    const minEntries = 3;
    const currentCount = entries.length;
    const remaining = Math.max(0, minEntries - currentCount);
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Leaf size={20} color={INSIGHTS_COLORS.accent} />
          <Text style={styles.title}>情绪触发洞察</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Sprout size={40} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {remaining > 0 
              ? `再记录 ${remaining} 条情绪即可查看洞察` 
              : '还没有足够的数据'}
          </Text>
          <Text style={styles.emptySubtext}>记录更多情绪来获取洞察吧</Text>
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
                {currentCount}/{minEntries}
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
        <Leaf size={20} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>情绪触发洞察</Text>
      </View>
      <Text style={styles.subtitle}>了解什么容易影响你的情绪</Text>

      <View style={styles.cardsContainer}>
        {triggerData.map((trigger, index) => (
          <View key={trigger.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <Text style={styles.triggerName}>{trigger.name}</Text>
              <Text style={styles.triggerCount}>{trigger.count}次</Text>
            </View>
            <View style={styles.adviceContainer}>
              <Sparkles size={14} color={INSIGHTS_COLORS.secondary} />
              <Text style={styles.adviceText}>
                {TRIGGER_ADVICE[trigger.name] || TRIGGER_ADVICE['其他']}
              </Text>
            </View>
            <PrescriptionCard
              trigger={trigger.name}
              moodLevel={Math.min(5, Math.max(1, Math.round(trigger.avgMoodLevel))) as MoodLevel}
              entries={entries}
            />
          </View>
        ))}
      </View>

      {actionLoop && (
        <View style={styles.loopContainer}>
          <Text style={styles.loopTitle}>行动闭环（焚语特色）</Text>
          <Text style={styles.loopText}>1. 触发源：{actionLoop.trigger}</Text>
          <Text style={styles.loopText}>2. 本次行动：{actionLoop.stepOne}</Text>
          <Text style={styles.loopText}>3. 回访时间：{actionLoop.revisitText} 再看一次情绪变化</Text>
        </View>
      )}
    </View>
  );
};

export const TriggerInsight = memo(TriggerInsightComponent);
