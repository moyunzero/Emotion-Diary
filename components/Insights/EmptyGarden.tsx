import { Flower2, Heart, Leaf, Sparkles, Sprout } from 'lucide-react-native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, DESIGN_TOKENS } from '@/constants/colors';
import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { getInsightsColors } from './constants';

const EmptyGardenComponent: React.FC = () => {
  const { t } = useTranslation('insights');
  const { fontSize, borderRadius } = useResponsiveStyles();
  const { colors } = useThemeStyles();
  const insightsColors = useMemo(
    () => getInsightsColors(colors),
    [colors],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
          paddingVertical: 60,
        },
        iconContainer: {
          position: 'relative',
          marginBottom: 24,
        },
        sparkleContainer: {
          position: 'absolute',
          top: -8,
          right: -12,
        },
        title: {
          fontSize: fontSize.title,
          fontWeight: 'bold',
          color: insightsColors.text,
          marginBottom: 8,
        },
        subtitle: {
          fontSize: fontSize.body,
          color: insightsColors.textSecondary,
          marginBottom: 40,
        },
        tipContainer: {
          width: '100%',
          gap: 16,
          marginBottom: 40,
        },
        tipItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: insightsColors.cardBg,
          padding: 16,
          borderRadius: borderRadius.large,
          shadowColor: COLORS.shadow.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        },
        tipIcon: {
          width: 44,
          height: 44,
          borderRadius: DESIGN_TOKENS.borderRadius.md,
          backgroundColor: COLORS.gray[50],
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        },
        tipContent: {
          flex: 1,
        },
        tipTitle: {
          fontSize: fontSize.body,
          fontWeight: '600',
          color: insightsColors.text,
          marginBottom: 2,
        },
        tipText: {
          fontSize: fontSize.small,
          color: insightsColors.textSecondary,
        },
        encouragement: {
          fontSize: fontSize.body,
          color: insightsColors.accent,
          fontWeight: '500',
          textAlign: 'center',
        },
      }),
    [fontSize, borderRadius, insightsColors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Flower2 size={64} color={insightsColors.primary} style={{ opacity: 0.3 }} />
        <View style={styles.sparkleContainer}>
          <Sparkles size={24} color={insightsColors.accent} />
        </View>
      </View>
      
      <Text style={styles.title}>{t('empty.title')}</Text>
      <Text style={styles.subtitle}>{t('empty.subtitle')}</Text>
      
      <View style={styles.tipContainer}>
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Sprout size={20} color={insightsColors.primary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t('empty.tips.record.title')}</Text>
            <Text style={styles.tipText}>{t('empty.tips.record.text')}</Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Heart size={20} color={insightsColors.accent} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t('empty.tips.resolve.title')}</Text>
            <Text style={styles.tipText}>{t('empty.tips.resolve.text')}</Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Leaf size={20} color={insightsColors.growingColor} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{t('empty.tips.growth.title')}</Text>
            <Text style={styles.tipText}>{t('empty.tips.growth.text')}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.encouragement}>
        {t('empty.encouragement')}
      </Text>
    </View>
  );
};

export const EmptyGarden = memo(EmptyGardenComponent);
