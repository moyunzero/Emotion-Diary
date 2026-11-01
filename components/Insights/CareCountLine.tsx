import { useResponsiveStyles } from '@/hooks/useResponsiveStyles';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { careWeekCount } from '@/shared/entries/careWeekCount';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { MoodEntry } from '../../types';

interface CareCountLineProps {
  readonly entries: MoodEntry[];
}

/**
 * Garden first-screen care line (D-19): 「本周照料了 N 次」.
 * Digit color is always text.primary — including N=0.
 */
const CareCountLineComponent: React.FC<CareCountLineProps> = ({ entries }) => {
  const { t } = useTranslation('insights');
  const { fontSize, spacing, padding, borderRadius } = useResponsiveStyles();
  const { colors } = useThemeStyles();
  const n = useMemo(() => careWeekCount(entries), [entries]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: spacing.cardGap,
          paddingVertical: padding.card * 0.6,
          paddingHorizontal: padding.card,
          borderRadius: borderRadius.card,
        },
        line: {
          fontSize: fontSize.body,
          fontWeight: '400',
          color: colors.text.primary,
          textAlign: 'center',
        },
      }),
    [colors, fontSize, spacing, padding, borderRadius],
  );

  return (
    <View style={styles.container} testID="care-count-line">
      <Text style={styles.line}>{t('care.weekCount', { n })}</Text>
    </View>
  );
};

export const CareCountLine = memo(CareCountLineComponent);
