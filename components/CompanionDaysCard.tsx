/**
 * 陪伴天数卡片组件
 * 显示用户的陪伴天数，包含数字增长动画
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCompanionFirstEntryDate } from '@/hooks/useCompanionFirstEntryDate';
import { calculateDays } from '../services/companionDaysService';

interface CompanionDaysCardProps {
  onPress: () => void;
}

export default function CompanionDaysCard({ onPress }: CompanionDaysCardProps) {
  const firstEntryDate = useCompanionFirstEntryDate();

  // 计算陪伴天数
  const days = calculateDays(firstEntryDate);
  
  // 用于显示的动画天数
  const [displayDays, setDisplayDays] = useState(0);
  
  useEffect(() => {
    // 如果天数为0，直接显示
    if (days === 0) {
      setDisplayDays(0);
      return;
    }
    
    const frames = 60; // 60帧动画
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
    
    // 启动动画
    animationId = requestAnimationFrame(animate);
    
    // 清理函数
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
        <Text style={styles.label}>陪伴天数</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'Lato_700Bold',
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Lato_400Regular',
  },
});
