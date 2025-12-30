export enum MoodLevel {
  ANNOYED = 1,
  UPSET = 2,
  ANGRY = 3,
  FURIOUS = 4,
  EXPLOSIVE = 5,
}

export enum Deadline {
  TODAY = 'today',
  THIS_WEEK = 'week',
  THIS_MONTH = 'month',
  LATER = 'later',
  SELF_DIGEST = 'self',
}

export enum Status {
  ACTIVE = 'active',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
}

/**
 * 编辑历史记录
 */
export interface EditHistory {
  editedAt: number;
  previousContent: string;
  previousMoodLevel: MoodLevel;
  previousDeadline: string;
  previousPeople: string[];
  previousTriggers: string[];
}

export interface MoodEntry {
  id: string;
  timestamp: number;
  moodLevel: MoodLevel;
  content: string;
  deadline: string; // Changed to string to support custom values
  people: string[]; // e.g., "Boyfriend", "Mom"
  triggers: string[]; // e.g., "Late", "Chore"
  status: Status;
  resolvedAt?: number;
  editHistory?: EditHistory[]; // 编辑历史记录
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface WeatherState {
  score: number; // 0 - 100+
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  description: string;
}

export interface AppState {
  entries: MoodEntry[];
  settings: {
    weatherThresholds: {
      cloudy: number;
      rainy: number;
      stormy: number;
    };
  };
}

// AI相关类型
export interface EmotionForecast {
  predictions: {
    date: string;
    predictedMoodLevel: number;
    confidence: number;
    riskLevel: 'high' | 'medium' | 'low';
  }[];
  warnings: {
    date: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  summary: string;
  lastUpdated?: number;
}

export interface EmotionPodcast {
  content: string;
  period: 'week' | 'month';
  generatedAt: number;
}