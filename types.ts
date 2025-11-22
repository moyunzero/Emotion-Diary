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
