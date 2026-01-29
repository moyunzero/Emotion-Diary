import {
    CloudRain, Crown,
    Edit, Frown, Gem, Heart, LucideIcon, Moon, PartyPopper, Sparkles, Sprout, Star, Sun
} from 'lucide-react-native';

/**
 * Emoji to icon mapping type
 */
export type EmojiIconMap = {
  [emoji: string]: {
    icon: LucideIcon;
    name: string;
    semanticMeaning: string;
  };
};

/**
 * Centralized mapping from emoji characters to vector icons
 */
export const EMOJI_ICON_MAP: EmojiIconMap = {
  // Error and negative emotions
  '😔': {
    icon: Frown,
    name: 'Frown',
    semanticMeaning: 'Sadness, disappointment, error state',
  },
  
  // Milestone achievements
  '🌱': {
    icon: Sprout,
    name: 'Sprout',
    semanticMeaning: 'New beginning, growth, 7-day milestone',
  },
  '🌙': {
    icon: Moon,
    name: 'Moon',
    semanticMeaning: 'Monthly cycle, 30-day milestone',
  },
  '💎': {
    icon: Gem,
    name: 'Gem',
    semanticMeaning: 'Precious achievement, 100-day milestone',
  },
  '🎉': {
    icon: PartyPopper,
    name: 'PartyPopper',
    semanticMeaning: 'Celebration, 365-day milestone',
  },
  '⭐': {
    icon: Star,
    name: 'Star',
    semanticMeaning: 'Excellence, 500-day milestone',
  },
  '👑': {
    icon: Crown,
    name: 'Crown',
    semanticMeaning: 'Ultimate achievement, 1000-day milestone',
  },
  
  // Positive emotions and actions
  '💫': {
    icon: Sparkles,
    name: 'Sparkles',
    semanticMeaning: 'Magic, completion, positive action',
  },
  '💙': {
    icon: Heart,
    name: 'Heart',
    semanticMeaning: 'Love, care, emotional support',
  },
  
  // Weather and mood metaphors
  '🎊': {
    icon: PartyPopper,
    name: 'PartyPopper',
    semanticMeaning: 'Celebration, success, achievement',
  },
  '🌤️': {
    icon: Sun,
    name: 'Sun',
    semanticMeaning: 'Partly sunny, improving mood',
  },
  '🌧️': {
    icon: CloudRain,
    name: 'CloudRain',
    semanticMeaning: 'Rainy, sad mood',
  },
  '☀️': {
    icon: Sun,
    name: 'Sun',
    semanticMeaning: 'Sunny, happy mood',
  },
  
  // Editing and customization
  '✎': {
    icon: Edit,
    name: 'Edit',
    semanticMeaning: 'Edit, customize, modify',
  },
};

/**
 * Get icon component by emoji character
 */
export const getIconByEmoji = (emoji: string): LucideIcon | null => {
  return EMOJI_ICON_MAP[emoji]?.icon || null;
};

/**
 * Get icon name by emoji character
 */
export const getIconNameByEmoji = (emoji: string): string | null => {
  return EMOJI_ICON_MAP[emoji]?.name || null;
};

/**
 * Check if an emoji has a corresponding icon mapping
 */
export const hasIconMapping = (emoji: string): boolean => {
  return emoji in EMOJI_ICON_MAP;
};

/**
 * Get all mapped emojis
 */
export const getAllMappedEmojis = (): string[] => {
  return Object.keys(EMOJI_ICON_MAP);
};
