import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { INSIGHTS_COLORS } from './constants';
import { getGrowthStage } from './utils';
import AppIcon from '../icons/AppIcon';

interface HealingProgressProps {
  totalCount: number;
  resolvedCount: number;
}

const HealingProgressComponent: React.FC<HealingProgressProps> = ({ totalCount, resolvedCount }) => {
  const { padding, fontSize, spacing, borderRadius, layout } = useResponsiveStyles();
  
  // 响应式计算环形进度条尺寸
  const progressSize = useMemo(() => {
    return layout.maxContentWidth > 600 ? 140 : 120;
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
          width: progressSize,
          height: progressSize,
          alignItems: 'center',
          justifyContent: 'center',
        },
        centerIcon: {
          position: 'absolute',
          alignItems: 'center',
        },
        stageLabel: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.secondary,
          fontWeight: 'bold',
          marginTop: spacing.xs,
        },
        stats: {
          flex: 1,
          marginLeft: spacing.cardGap,
          gap: spacing.cardGap,
        },
        statItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        statNumber: {
          fontSize: fontSize.title,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
        },
        statLabel: {
          fontSize: fontSize.small,
          color: INSIGHTS_COLORS.textSecondary,
        },
        encouragement: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm - 2,
          marginTop: spacing.cardGap,
          paddingTop: spacing.cardGap,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
        },
        encouragementText: {
          fontSize: fontSize.body,
          color: INSIGHTS_COLORS.accent,
          fontStyle: 'italic',
        },
      }),
    [padding, fontSize, spacing, borderRadius, progressSize]
  );
  const rate = totalCount > 0 ? resolvedCount / totalCount : 0;
  const pendingCount = totalCount - resolvedCount;
  const growthStage = getGrowthStage(rate);
  const GrowthIcon = growthStage.icon;
  
  // 环形进度条参数
  const size = progressSize;
  const strokeWidth = spacing.sm + spacing.xs;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - rate);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppIcon name="Heart" size={20} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>治愈进度</Text>
      </View>
      
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
              stroke={INSIGHTS_COLORS.secondary}
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
            <GrowthIcon size={36} color={INSIGHTS_COLORS.secondary} />
            <Text style={styles.stageLabel}>{growthStage.label}</Text>
          </View>
        </View>

        {/* 统计信息 */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <AppIcon name="Flower2" size={18} color={INSIGHTS_COLORS.secondary} />
            <Text style={styles.statNumber}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>朵情绪小花绽放</Text>
          </View>
          <View style={styles.statItem}>
            <AppIcon name="Sprout" size={18} color={INSIGHTS_COLORS.textSecondary} />
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>颗种子等待发芽</Text>
          </View>
        </View>
      </View>

      {/* 鼓励文案 */}
      <View style={styles.encouragement}>
        <AppIcon name="Sparkles" size={14} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.encouragementText}>
          每一次面对情绪，都是在浇灌自己的心灵
        </Text>
      </View>
    </View>
  );
};

export const HealingProgress = memo(HealingProgressComponent);
