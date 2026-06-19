import { Flower2 } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { INSIGHTS_COLORS } from './constants';

interface GardenHeaderProps {
  totalEntries: number;
  resolvedCount: number;
}

const GardenHeaderComponent: React.FC<GardenHeaderProps> = ({ totalEntries, resolvedCount }) => {
  const { t } = useTranslation('insights');
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
    if (totalEntries === 0) return t('header.status.empty');
    const rate = resolvedCount / totalEntries;
    if (rate >= 0.7) return t('header.status.thriving');
    return t('header.status.needsWater');
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Flower2 size={28} color={INSIGHTS_COLORS.accent} />
        <Text style={styles.title}>{t('header.title')}</Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
        {getGardenStatus()}
      </Text>
    </View>
  );
};

export const GardenHeader = memo(GardenHeaderComponent);
