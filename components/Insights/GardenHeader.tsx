import { Flower2 } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { INSIGHTS_COLORS } from './constants';

interface GardenHeaderProps {
  totalEntries: number;
  resolvedCount: number;
}

const GardenHeaderComponent: React.FC<GardenHeaderProps> = ({ totalEntries, resolvedCount }) => {
  const { padding, fontSize, spacing } = useResponsiveStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: padding.horizontal,
          paddingBottom: spacing.component,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 4,
        },
        title: {
          fontSize: fontSize.title,
          fontWeight: 'bold',
          color: INSIGHTS_COLORS.text,
        },
        subtitle: {
          fontSize: fontSize.body,
          color: INSIGHTS_COLORS.textSecondary,
          marginLeft: 38,
          marginBottom: 0,
        },
      }),
    [padding, fontSize, spacing]
  );

  const getGardenStatus = () => {
    if (totalEntries === 0) return '开始种下你的第一颗种子吧';
    const rate = resolvedCount / totalEntries;
    if (rate >= 0.7) return '你的花园正在茁壮成长';
    return '记得给花园浇浇水哦';
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Flower2 size={28} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>我的心灵花园</Text>
      </View>
      <Text style={styles.subtitle}>{getGardenStatus()}</Text>
    </View>
  );
};

export const GardenHeader = memo(GardenHeaderComponent);
