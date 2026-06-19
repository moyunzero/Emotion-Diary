import { Flower2, Heart, Sparkles, Sprout } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { INSIGHTS_COLORS } from './constants';
import { getGrowthStage } from './utils';

interface HealingProgressProps {
  totalCount: number;
  resolvedCount: number;
}

const HealingProgressComponent: React.FC<HealingProgressProps> = ({ totalCount, resolvedCount }) => {
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
          color: INSIGHTS_COLORS.secondary,
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
      }),
    [padding, fontSize, spacing, borderRadius]
  );
  const rate = totalCount > 0 ? resolvedCount / totalCount : 0;
  const pendingCount = totalCount - resolvedCount;
  const growthStage = useMemo(() => getGrowthStage(rate, t), [rate, t]);
  const GrowthIcon = growthStage.icon;
  
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
            <View style={styles.statRow}>
              <Flower2 size={18} color={INSIGHTS_COLORS.secondary} />
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
