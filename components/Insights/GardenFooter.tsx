import { Flower2, Leaf } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { responsiveBorderRadius, responsiveFontSize, responsivePadding } from '../../utils/responsiveUtils';
import { INSIGHTS_COLORS } from './constants';

interface GardenFooterProps {
  thisMonthCount: number;
  lastMonthCount: number;
  resolvedCount: number;
}

const GardenFooterComponent: React.FC<GardenFooterProps> = ({ 
  thisMonthCount, 
  lastMonthCount, 
  resolvedCount 
}) => {
  const getMessage = () => {
    if (thisMonthCount === 0) {
      return '开始记录，让你的心灵花园生根发芽吧';
    }
    
    const diff = thisMonthCount - lastMonthCount;
    if (diff > 0) {
      return `本月你认真照料了花园 ${thisMonthCount} 次，比上月多了 ${diff} 次`;
    } else if (diff < 0) {
      return `本月你照料了花园 ${thisMonthCount} 次，记得常来看看哦`;
    } else {
      return `你的花园正在变得越来越美丽`;
    }
  };

  const getSubMessage = () => {
    if (resolvedCount > 0) {
      return `每一朵盛开的花，都是你勇敢面对情绪的证明`;
    }
    return '每一次记录，都是照料心灵的开始';
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

const styles = StyleSheet.create({
  container: {
    padding: responsivePadding.card(20),
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: responsiveBorderRadius.card(),
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mainText: {
    fontSize: responsiveFontSize.body(14),
    color: INSIGHTS_COLORS.accent,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  subText: {
    fontSize: responsiveFontSize.small(12),
    color: '#BE123C',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export const GardenFooter = memo(GardenFooterComponent);
