/**
 * 陪伴天数卡片组件
 * 显示用户的陪伴天数，包含数字增长动画
 */

import { type ColorPalette, DESIGN_TOKENS } from '@/constants/colors';
import { useCompanionFirstEntryDate } from '@/hooks/useCompanionFirstEntryDate';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateDays } from '../services/companionDaysService';

interface CompanionDaysCardProps {
  readonly onPress: () => void;
}

function createCompanionDaysCardStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    content: {
      alignItems: 'center',
    },
    value: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.gray[800],
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      color: colors.gray[400],
    },
  });
}

export default function CompanionDaysCard({ onPress }: CompanionDaysCardProps) {
  const { t } = useTranslation('profile');
  const firstEntryDate = useCompanionFirstEntryDate();
  const { colors } = useThemeStyles();
  const styles = useMemo(
    () => createCompanionDaysCardStyles(colors),
    [colors],
  );

  const days = calculateDays(firstEntryDate);
  
  const [displayDays, setDisplayDays] = useState(0);
  
  useEffect(() => {
    if (days === 0) {
      setDisplayDays(0);
      return;
    }
    
    const frames = 60;
    const increment = days / frames;
    
    let currentFrame = 0;
    let animationId: number;
    
    const animate = () => {
      currentFrame++;
      if (currentFrame <= frames) {
        setDisplayDays(Math.floor(increment * currentFrame));
        animationId = requestAnimationFrame(animate);
      } else {
        setDisplayDays(days);
      }
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [days]);
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.value}>{displayDays}</Text>
        <Text style={styles.label}>{t('stats.companionDaysLabel')}</Text>
      </View>
    </TouchableOpacity>
  );
}
