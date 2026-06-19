import { Deadline, MoodLevel } from './types';

// 情绪图标配置 - 使用天气主题图标，符合"情绪气象站"定位
export const MOOD_CONFIG = {
  [MoodLevel.ANNOYED]: {
    level: 1,
    iconName: 'Droplet',
    iconColor: '#F59E0B',
  },
  [MoodLevel.UPSET]: {
    level: 2,
    iconName: 'Cloud',
    iconColor: '#F97316',
  },
  [MoodLevel.ANGRY]: {
    level: 3,
    iconName: 'CloudRain',
    iconColor: '#EF4444',
  },
  [MoodLevel.FURIOUS]: {
    level: 4,
    iconName: 'CloudLightning',
    iconColor: '#DC2626',
  },
  [MoodLevel.EXPLOSIVE]: {
    level: 5,
    iconName: 'Zap',
    iconColor: '#991B1B',
  },
} as const;

export const DEADLINE_CONFIG = {
  [Deadline.TODAY]: {
    color: 'bg-red-100 text-red-700',
  },
  [Deadline.THIS_WEEK]: {
    color: 'bg-orange-100 text-orange-700',
  },
  [Deadline.THIS_MONTH]: {
    color: 'bg-yellow-100 text-yellow-700',
  },
  [Deadline.LATER]: {
    color: 'bg-blue-100 text-blue-700',
  },
  [Deadline.SELF_DIGEST]: {
    color: 'bg-gray-100 text-gray-700',
  },
} as const;

export const PEOPLE_KEYS = [
  'boyfriend',
  'girlfriend',
  'husband',
  'wife',
  'friend',
  'other',
] as const;

export const TRIGGER_KEYS = [
  'work',
  'study',
  'family',
  'friends',
  'communication',
  'trust',
  'privacy',
  'other',
] as const;

// 单条记录最多保留的编辑历史数量，防止 entry 对象无限增长占用 AsyncStorage
export const MAX_EDIT_HISTORY = 10;
