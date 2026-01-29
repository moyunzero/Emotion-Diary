import { Flower2, Heart, Leaf, Sparkles, Sprout } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { responsiveBorderRadius, responsiveFontSize } from '../../utils/responsiveUtils';
import { INSIGHTS_COLORS } from './constants';

const EmptyGardenComponent: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Flower2 size={64} color={INSIGHTS_COLORS.primary} style={{ opacity: 0.3 }} />
        <View style={styles.sparkleContainer}>
          <Sparkles size={24} color={INSIGHTS_COLORS.secondary} />
        </View>
      </View>
      
      <Text style={styles.title}>你的心灵花园</Text>
      <Text style={styles.subtitle}>还在等待第一颗种子</Text>
      
      <View style={styles.tipContainer}>
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Sprout size={20} color={INSIGHTS_COLORS.secondary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>记录情绪</Text>
            <Text style={styles.tipText}>每一次表达都是种下种子</Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Heart size={20} color={INSIGHTS_COLORS.accent} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>和解打卡</Text>
            <Text style={styles.tipText}>让情绪之花绽放</Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Leaf size={20} color={INSIGHTS_COLORS.growingColor} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>见证成长</Text>
            <Text style={styles.tipText}>花园会记录你的每一步</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.encouragement}>
        点击下方「记录」开始你的治愈之旅 ✨
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: responsiveFontSize.title(24),
    fontWeight: 'bold',
    color: INSIGHTS_COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: responsiveFontSize.body(16),
    color: INSIGHTS_COLORS.textSecondary,
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
    backgroundColor: INSIGHTS_COLORS.cardBg,
    padding: 16,
    borderRadius: responsiveBorderRadius.large(),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: responsiveFontSize.body(15),
    fontWeight: '600',
    color: INSIGHTS_COLORS.text,
    marginBottom: 2,
  },
  tipText: {
    fontSize: responsiveFontSize.small(13),
    color: INSIGHTS_COLORS.textSecondary,
  },
  encouragement: {
    fontSize: responsiveFontSize.body(14),
    color: INSIGHTS_COLORS.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export const EmptyGarden = memo(EmptyGardenComponent);
