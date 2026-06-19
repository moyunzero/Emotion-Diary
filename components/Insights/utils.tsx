import { Flower2, Leaf, Sprout, Sun, TreeDeciduous } from 'lucide-react-native';
import type { TFunction } from 'i18next';
import React from 'react';
import { MOOD_CONFIG } from '../../constants';
import { getMondayWeekRangeContaining } from '../../shared/time-range';
import { MoodLevel } from '../../types';
import { getMoodIcon } from '../../utils/moodIconUtils';

type InsightsT = TFunction<'insights'>;

// 获取本周的日期范围
export const getWeekDates = () => {
  const { startMs } = getMondayWeekRangeContaining(new Date());
  const monday = new Date(startMs);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// 获取星期几的本地化名称
export const getWeekdayName = (date: Date, t: InsightsT) => {
  return t(`utils.weekdays.${date.getDay()}` as 'utils.weekdays.0');
};

// 判断是否是今天
export const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// 获取情绪等级对应的天气图标
export const getMoodWeatherIcon = (level: MoodLevel | null, size: number = 24): React.ReactElement => {
  if (level === null) return <Sprout size={size} color="#D1D5DB" />;
  
  const config = MOOD_CONFIG[level];
  
  if (config) {
    return getMoodIcon(config.iconName, config.iconColor, size);
  }
  
  // 默认值
  return <Sun size={size} color="#F59E0B" />;
};

// 获取情绪等级对应的花朵状态文案
export const getMoodFlowerStatus = (level: number | null, t: InsightsT) => {
  if (level === null) {
    return t('utils.flowerStatus.seed');
  }
  const key = String(level) as '1' | '2' | '3' | '4' | '5';
  if (key in { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 }) {
    return t(`utils.flowerStatus.${key}`);
  }
  return t('utils.flowerStatus.seed');
};

// 获取花盆状态
export const getFlowerPotStatus = (
  resolveRate: number,
  colors: {
    bloomingColor: string;
    growingColor: string;
    needWaterColor: string;
  },
  t: InsightsT,
) => {
  if (resolveRate >= 0.7) {
    return {
      status: 'blooming',
      label: t('utils.potStatus.blooming'),
      color: colors.bloomingColor,
    };
  } else if (resolveRate >= 0.3) {
    return {
      status: 'growing',
      label: t('utils.potStatus.growing'),
      color: colors.growingColor,
    };
  } else {
    return {
      status: 'needWater',
      label: t('utils.potStatus.needWater'),
      color: colors.needWaterColor,
    };
  }
};

// 获取成长阶段
export const getGrowthStage = (rate: number, t: InsightsT) => {
  if (rate >= 0.8) {
    return {
      stage: 'bloom',
      label: t('utils.growthStage.bloom'),
      icon: Flower2,
    };
  }
  if (rate >= 0.6) {
    return {
      stage: 'bud',
      label: t('utils.growthStage.bud'),
      icon: TreeDeciduous,
    };
  }
  if (rate >= 0.4) {
    return {
      stage: 'seedling',
      label: t('utils.growthStage.seedling'),
      icon: Leaf,
    };
  }
  if (rate >= 0.2) {
    return {
      stage: 'sprout',
      label: t('utils.growthStage.sprout'),
      icon: Sprout,
    };
  }
  return {
    stage: 'seed',
    label: t('utils.growthStage.seed'),
    icon: Sprout,
  };
};
