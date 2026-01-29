/**
 * 陪伴天数卡片组件
 * 显示用户的陪伴天数，包含数字增长动画
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateDays } from '../services/companionDaysService';
import { useAppStore } from '../store/useAppStore';

interface CompanionDaysCardProps {
  onPress: () => void;
}

export default function CompanionDaysCard({ onPress }: CompanionDaysCardProps) {
  const user = useAppStore(state => state.user);
  const entries = useAppStore(state => state.entries);
  
  // 用于存储 firstEntryDate（支持游客用户）
  const [firstEntryDate, setFirstEntryDate] = useState<number | null>(null);
  
  // 加载 firstEntryDate（登录用户或游客用户）
  useEffect(() => {
    const loadFirstEntryDate = async () => {
      if (user?.firstEntryDate) {
        // 登录用户：从 user 对象读取
        setFirstEntryDate(user.firstEntryDate);
      } else {
        // 游客用户：从 AsyncStorage 读取
        try {
          const guestDate = await AsyncStorage.getItem('guest_first_entry_date');
          if (guestDate) {
            setFirstEntryDate(parseInt(guestDate, 10));
          } else {
            setFirstEntryDate(null);
          }
        } catch (error) {
          console.error('读取游客 firstEntryDate 失败:', error);
          setFirstEntryDate(null);
        }
      }
    };
    
    loadFirstEntryDate();
  }, [user?.firstEntryDate, entries.length]); // 当用户状态或记录数量变化时重新加载
  
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
    
    // 动画持续时间：天数越大，动画越快
    const duration = days > 100 ? 800 : days > 30 ? 1200 : 1500;
    const frames = 60; // 60帧动画
    const increment = days / frames;
    const frameTime = duration / frames;
    
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
