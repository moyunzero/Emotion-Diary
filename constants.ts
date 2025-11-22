import { Deadline, MoodLevel, Status } from './types';
export const MOOD_CONFIG = {
  [MoodLevel.ANNOYED]: {
    emoji: '😒',
    label: '有点烦',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  [MoodLevel.UPSET]: {
    emoji: '😔',
    label: '不开心',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
  [MoodLevel.ANGRY]: {
    emoji: '😠',
    label: '生气了',
    color: 'bg-red-100',
    textColor: 'text-red-700',
  },
  [MoodLevel.FURIOUS]: {
    emoji: '🤬',
    label: '很生气',
    color: 'bg-red-200',
    textColor: 'text-red-800',
  },
  [MoodLevel.EXPLOSIVE]: {
    emoji: '💥',
    label: '爆炸了',
    color: 'bg-red-300',
    textColor: 'text-red-900',
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
  '爸爸',
  '妈妈',
  '同事',
  '朋友',
  '室友',
  '其他',
];

export const TRIGGER_OPTIONS = [
  '迟到',
  '家务',
  '金钱',
  '工作',
  '学习',
  '健康',
  '家庭',
  '朋友',
  '消费',
  '沟通',
  '信任',
  '隐私',
  '其他',
];

export const MOCK_ENTRIES = [
  {
    id: '1',
    timestamp: Date.now() - 86400000, // 1 day ago
    moodLevel: MoodLevel.ANGRY,
    content: '又迟到，而且毫无歉意，完全不尊重我的时间！每次约会都这样，真的受够了！',
    deadline: Deadline.TODAY,
    people: ['男朋友'],
    triggers: ['迟到', '沟通'],
    status: Status.ACTIVE,
  },
  {
    id: '2',
    timestamp: Date.now() - 172800000, // 2 days ago
    moodLevel: MoodLevel.UPSET,
    content: '说好一起做家务，结果又是我一个人收拾整个房子，感觉像保姆一样。',
    deadline: Deadline.THIS_WEEK,
    people: ['室友'],
    triggers: ['家务'],
    status: Status.ACTIVE,
  },
  {
    id: '3',
    timestamp: Date.now() - 259200000, // 3 days ago
    moodLevel: MoodLevel.ANNOYED,
    content: '答应帮我看看简历，结果一周了都没回复，感觉很失望。',
    deadline: Deadline.THIS_MONTH,
    people: ['朋友'],
    triggers: ['工作', '信任'],
    status: Status.RESOLVED,
    resolvedAt: Date.now() - 86400000,
  },
  {
    id: '4',
    timestamp: Date.now() - 345600000, // 4 days ago
    moodLevel: MoodLevel.FURIOUS,
    content: '翻我手机聊天记录！这是侵犯隐私，完全没有信任可言！',
    deadline: Deadline.TODAY,
    people: ['女朋友'],
    triggers: ['隐私', '信任'],
    status: Status.ACTIVE,
  },
  {
    id: '5',
    timestamp: Date.now() - 432000000, // 5 days ago
    moodLevel: MoodLevel.EXPLOSIVE,
    content: '工资卡被冻结了，事先完全没有商量，凭什么这么独断专行！',
    deadline: Deadline.LATER,
    people: ['老公'],
    triggers: ['金钱', '沟通'],
    status: Status.ACTIVE,
  },
];
