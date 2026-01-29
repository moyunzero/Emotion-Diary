import { Flower2, Leaf, Sprout, Sun, TreeDeciduous } from 'lucide-react-native';
import React from 'react';
import { MOOD_CONFIG } from '../../constants';
import { MoodLevel } from '../../types';
import { getMoodIcon } from '../../utils/moodIconUtils';

// 获取本周的日期范围
export const getWeekDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// 获取星期几的中文名
export const getWeekdayName = (date: Date) => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};

// 判断是否是今天
export const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// 获取情绪等级对应的天气图标
export const getMoodWeatherIcon = (level: number | null, size: number = 24): React.ReactElement => {
  if (level === null) return <Sprout size={size} color="#D1D5DB" />;
  
  const moodLevel = level as MoodLevel;
  const config = MOOD_CONFIG[moodLevel];
  
  if (config) {
    return getMoodIcon(config.iconName, config.iconColor, size);
  }
  
  // 默认值
  return <Sun size={size} color="#F59E0B" />;
};

// 获取情绪等级对应的花朵状态文案
export const getMoodFlowerStatus = (level: number | null) => {
  if (level === null) return '种子';
  switch (level) {
    case 1: return '含苞待放';
    case 2: return '花苞微开';
    case 3: return '需要照料';
    case 4: return '有点蔫';
    case 5: return '需紧急浇水';
    default: return '种子';
  }
};

// 获取花盆状态
export const getFlowerPotStatus = (resolveRate: number, colors: {
  bloomingColor: string;
  growingColor: string;
  needWaterColor: string;
}) => {
  if (resolveRate >= 0.7) {
    return { status: 'blooming', label: '繁花盛开', color: colors.bloomingColor };
  } else if (resolveRate >= 0.3) {
    return { status: 'growing', label: '正常生长', color: colors.growingColor };
  } else {
    return { status: 'needWater', label: '需要浇水', color: colors.needWaterColor };
  }
};

// 获取成长阶段
export const getGrowthStage = (rate: number) => {
  if (rate >= 0.8) return { stage: 'bloom', label: '开花', icon: Flower2 };
  if (rate >= 0.6) return { stage: 'bud', label: '花苞', icon: TreeDeciduous };
  if (rate >= 0.4) return { stage: 'seedling', label: '幼苗', icon: Leaf };
  if (rate >= 0.2) return { stage: 'sprout', label: '发芽', icon: Sprout };
  return { stage: 'seed', label: '种子', icon: Sprout };
};
