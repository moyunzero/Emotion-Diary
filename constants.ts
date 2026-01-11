import { Deadline, MoodLevel } from './types';

// 情绪图标配置 - 使用天气主题图标，符合"情绪气象站"定位
export const MOOD_CONFIG = {
  [MoodLevel.ANNOYED]: {
    level: 1,
    iconName: 'Droplet', // 雨滴 - 轻微的情绪波动
    label: '有点委屈',
    iconColor: '#F59E0B', // 黄色
  },
  [MoodLevel.UPSET]: {
    level: 2,
    iconName: 'Cloud', // 云朵 - 心情低落
    label: '心情低落',
    iconColor: '#F97316', // 橙色
  },
  [MoodLevel.ANGRY]: {
    level: 3,
    iconName: 'CloudRain', // 雨云 - 感到生气
    label: '感到生气',
    iconColor: '#EF4444', // 红色
  },
  [MoodLevel.FURIOUS]: {
    level: 4,
    iconName: 'CloudLightning', // 闪电云 - 非常愤怒
    label: '非常愤怒',
    iconColor: '#DC2626', // 深红色
  },
  [MoodLevel.EXPLOSIVE]: {
    level: 5,
    iconName: 'Zap', // 闪电 - 情绪爆发
    label: '情绪爆发',
    iconColor: '#991B1B', // 最深红色
  },
};

export const DEADLINE_CONFIG = {
  [Deadline.TODAY]: {
    label: '今天谈',
    color: 'bg-red-100 text-red-700',
  },
  [Deadline.THIS_WEEK]: {
    label: '本周内',
    color: 'bg-orange-100 text-orange-700',
  },
  [Deadline.THIS_MONTH]: {
    label: '本月内',
    color: 'bg-yellow-100 text-yellow-700',
  },
  [Deadline.LATER]: {
    label: '以后说',
    color: 'bg-blue-100 text-blue-700',
  },
  [Deadline.SELF_DIGEST]: {
    label: '自己消化',
    color: 'bg-gray-100 text-gray-700',
  },
};

export const PEOPLE_OPTIONS = [
  '男朋友',
  '女朋友',
  '老公',
  '老婆',
  '朋友',
  '其他',
];

export const TRIGGER_OPTIONS = [
  '工作',
  '学习',
  '家庭',
  '朋友',
  '沟通',
  '信任',
  '隐私',
  '其他',
];
