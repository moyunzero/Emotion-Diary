import { Flower2, Heart, Sparkles, Sprout } from 'lucide-react-native';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import type { GrowthStageId } from '@/services/gardenMilestone';
import { INSIGHTS_COLORS } from './constants';
import { getGrowthStage } from './utils';

const STAGE_RATE_FOR_ICON: Record<GrowthStageId, number> = {
  seed: 0,
  sprout: 0.2,
  seedling: 0.4,
  bud: 0.6,
  bloom: 0.8,
};

interface HealingProgressProps {
  totalCount: number;
  resolvedCount: number;
  pendingStage?: GrowthStageId | null;
  onMilestoneShown?: (stage: GrowthStageId) => void;
}

const HealingProgressComponent: React.FC<HealingProgressProps> = ({
  totalCount,
  resolvedCount,
  pendingStage,
  onMilestoneShown,
}) => {
  const { t } = useTranslation('insights');
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
          marginBottom: spacing.component,
        },
        title: {
          fontSize: fontSize.cardTitle,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
        },
        progressContainer: {
          position: 'relative',
          width: 120,
          height: 120,
          alignItems: 'center',
          justifyContent: 'center',
        },
        centerIcon: {
          position: 'absolute',
          alignItems: 'center',
        },
        stageLabel: {
          fontSize: 12,
          color: INSIGHTS_COLORS.accent,
          fontWeight: 'bold',
          marginTop: 4,
        },
        stats: {
          flex: 1,
          marginLeft: 16,
          gap: 12,
        },
        statItem: {
          alignItems: 'flex-start',
          gap: 2,
        },
        statRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        statNumber: {
          fontSize: fontSize.title,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
        },
        statLabel: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
          flexShrink: 1,
        },
        encouragement: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
        },
        encouragementText: {
          fontSize: fontSize.body,
          color: INSIGHTS_COLORS.accent,
          fontStyle: 'italic',
        },
        milestoneBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: spacing.component,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: INSIGHTS_COLORS.accent + '14',
          borderLeftWidth: 4,
          borderLeftColor: INSIGHTS_COLORS.accent,
        },
        milestoneTextWrap: {
          flex: 1,
          gap: 2,
        },
        milestoneTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: INSIGHTS_COLORS.text,
        },
        milestoneBody: {
          fontSize: 14,
          fontWeight: '400',
          color: INSIGHTS_COLORS.textSecondary,
        },
      }),
    [padding, fontSize, spacing, borderRadius]
  );
  const milestoneHandledRef = useRef(false);
  useEffect(() => {
    if (pendingStage && onMilestoneShown && !milestoneHandledRef.current) {
      milestoneHandledRef.current = true;
      onMilestoneShown(pendingStage);
    }
  }, [pendingStage, onMilestoneShown]);

  const rate = totalCount > 0 ? resolvedCount / totalCount : 0;
  const pendingCount = totalCount - resolvedCount;
  const growthStage = useMemo(() => getGrowthStage(rate, t), [rate, t]);
  const GrowthIcon = growthStage.icon;
  const pendingStageMeta = useMemo(
    () =>
      pendingStage
        ? getGrowthStage(STAGE_RATE_FOR_ICON[pendingStage], t)
        : null,
    [pendingStage, t],
  );
  const PendingMilestoneIcon = pendingStageMeta?.icon;
  
  // 环形进度条参数
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - rate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heart size={20} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>{t('healing.title')}</Text>
      </View>

      {pendingStage && PendingMilestoneIcon ? (
        <View
          style={styles.milestoneBanner}
          testID="garden-milestone-banner"
          accessibilityLiveRegion="polite"
        >
          <PendingMilestoneIcon size={24} color={INSIGHTS_COLORS.accent} />
          <View style={styles.milestoneTextWrap}>
            <Text style={styles.milestoneTitle}>
              {t(`milestone.${pendingStage}.title` as never)}
            </Text>
            <Text style={styles.milestoneBody} numberOfLines={1}>
              {t(`milestone.${pendingStage}.body` as never)}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.content}>
        {/* 环形进度条 */}
        <View style={styles.progressContainer}>
          <Svg width={size} height={size}>
            {/* 背景圆环 */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* 进度圆环 */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={INSIGHTS_COLORS.accent}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          {/* 中心图标 */}
          <View style={styles.centerIcon}>
            <GrowthIcon size={36} color={INSIGHTS_COLORS.accent} />
            <Text style={styles.stageLabel}>{growthStage.label}</Text>
          </View>
        </View>

        {/* 统计信息 */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Flower2 size={18} color={INSIGHTS_COLORS.accent} />
              <Text style={styles.statNumber}>{resolvedCount}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={2}>
              {t('healing.stats.bloomed')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statRow}>
              <Sprout size={18} color={INSIGHTS_COLORS.textSecondary} />
              <Text style={styles.statNumber}>{pendingCount}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={2}>
              {t('healing.stats.pending')}
            </Text>
          </View>
        </View>
      </View>

      {/* 鼓励文案 */}
      <View style={styles.encouragement}>
        <Sparkles size={14} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.encouragementText} numberOfLines={2}>
          {t('healing.encouragement')}
        </Text>
      </View>
    </View>
  );
};

export const HealingProgress = memo(HealingProgressComponent);
