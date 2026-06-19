import { Flower2, Leaf } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { INSIGHTS_COLORS } from './constants';

interface GardenFooterProps {
  thisMonthCount: number;
  lastMonthCount: number;
  resolvedCount: number;
}

const GardenFooterComponent: React.FC<GardenFooterProps> = ({
  thisMonthCount,
  lastMonthCount,
  resolvedCount,
}) => {
  const { t } = useTranslation('insights');
  const { padding, fontSize, borderRadius } = useResponsiveStyles();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: padding.card,
          marginBottom: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#FECACA',
          borderRadius: borderRadius.card,
        },
        iconRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        },
        mainText: {
          fontSize: fontSize.body,
          color: INSIGHTS_COLORS.accent,
          textAlign: 'center',
          fontWeight: '500',
          lineHeight: 20,
        },
        subText: {
          fontSize: fontSize.small,
          color: '#BE123C',
          textAlign: 'center',
          marginTop: 6,
          fontStyle: 'italic',
        },
      }),
    [padding, fontSize, borderRadius]
  );

  const getMessage = () => {
    if (thisMonthCount === 0) {
      return t('footer.messages.startRecording');
    }
    
    const diff = thisMonthCount - lastMonthCount;
    if (diff > 0) {
      return t('footer.messages.thisMonthMore', { count: thisMonthCount, diff });
    } else if (diff < 0) {
      return t('footer.messages.thisMonthLess', { count: thisMonthCount });
    } else {
      return t('footer.messages.gardenBeautiful');
    }
  };

  const getSubMessage = () => {
    if (resolvedCount > 0) {
      return t('footer.subMessages.withResolved');
    }
    return t('footer.subMessages.default');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Flower2 size={18} color={INSIGHTS_COLORS.primary} />
        <Leaf size={16} color={INSIGHTS_COLORS.secondary} />
        <Flower2 size={18} color={INSIGHTS_COLORS.primary} />
      </View>
      <Text style={styles.mainText}>{getMessage()}</Text>
      <Text style={styles.subText}>{getSubMessage()}</Text>
    </View>
  );
};

export const GardenFooter = memo(GardenFooterComponent);
