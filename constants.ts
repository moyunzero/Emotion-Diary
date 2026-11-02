import { Deadline, MoodLevel } from './types';

// 情绪图标配置 - 使用天气主题图标，符合"情绪气象站"定位
export const MOOD_CONFIG = {
  [MoodLevel.ANNOYED]: {
    level: 1,
    iconName: 'Droplet',
  },
  [MoodLevel.UPSET]: {
    level: 2,
    iconName: 'Cloud',
  },
  [MoodLevel.ANGRY]: {
    level: 3,
    iconName: 'CloudRain',
  },
  [MoodLevel.FURIOUS]: {
    level: 4,
    iconName: 'CloudLightning',
  },
  [MoodLevel.EXPLOSIVE]: {
    level: 5,
    iconName: 'Zap',
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

/** Shortcut chip strip only (D-07 / FLOW-05). */
export const SHORTCUT_PEOPLE_KEYS = [
  'partner',
  'family',
  'colleague',
  'friend',
] as const;

/** History / resolver display keys — not shown on shortcut strip (D-11). */
export const LEGACY_PEOPLE_KEYS = [
  'boyfriend',
  'girlfriend',
  'husband',
  'wife',
  'friend',
  'other',
] as const;

/** Union for resolvers / backward compat (friend once). Prefer SHORTCUT for chips. */
export const PEOPLE_KEYS = [
  ...SHORTCUT_PEOPLE_KEYS,
  ...LEGACY_PEOPLE_KEYS.filter(
    (k) => !(SHORTCUT_PEOPLE_KEYS as readonly string[]).includes(k),
  ),
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
