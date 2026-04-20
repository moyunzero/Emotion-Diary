# 接口与类型定义文档

## 概述

本文档记录项目中所有重要的 TypeScript 类型定义和接口契约。

## 领域模型 (types.ts)

位于项目根目录的 `types.ts`，定义核心业务类型：

```typescript
// 情绪等级枚举
export enum MoodLevel {
  ANNOYED = 1,    // 有点委屈
  UPSET = 2,      // 心情低落
  ANGRY = 3,     // 感到生气
  FURIOUS = 4,   // 非常愤怒
  EXPLOSIVE = 5, // 情绪爆发
}

// 截止日期枚举
export enum Deadline {
  TODAY = 'today',
  THIS_WEEK = 'week',
  THIS_MONTH = 'month',
  LATER = 'later',
  SELF_DIGEST = 'self',
}

// 条目状态枚举
export enum Status {
  ACTIVE = 'active',      // 活跃
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved',  // 已解决
  BURNED = 'burned',      // 已焚烧
}

// 同步状态
export type SyncStatus = 'pending' | 'synced' | 'failed';
```

### MoodEntry (情绪条目)

```typescript
export interface MoodEntry {
  id: string;                              // 唯一标识
  timestamp: number;                       // 创建时间戳(ms)
  moodLevel: MoodLevel;                   // 情绪等级 (1-5)
  content: string;                         // 日记内容
  deadline: string;                        // 截止日期标签
  people: string[];                        // 相关人物
  triggers: string[];                      // 触发因素
  status: Status;                          // 当前状态
  resolvedAt?: number;                     // 解决时间戳
  burnedAt?: number;                       // 焚烧时间戳
  editHistory?: EditHistory[];              // 编辑历史
  audios?: AudioData[];                    // 语音附件
  intensity?: 1 | 2 | 3 | 4 | 5;          // 情绪强度
  syncStatus?: SyncStatus;                 // 同步状态
}

export interface EditHistory {
  editedAt: number;
  previousContent: string;
  previousMoodLevel: MoodLevel;
  previousDeadline: string;
  previousPeople: string[];
  previousTriggers: string[];
}

export interface AudioData {
  id: string;
  localUri: string;
  remoteUrl?: string;
  duration: number;
  fileSize: number;
  fileHash: string;
  name?: string;
  createdAt: number;
  syncStatus: SyncStatus;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  firstEntryDate?: number;
}

export interface WeatherState {
  score: number;           // 0-100+
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  description: string;
}
```

### AI 相关类型

```typescript
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
```

## Store 模块接口 (store/modules/types.ts)

### EntriesModule

```typescript
export interface EntriesModule {
  entries: MoodEntry[];
  
  addEntry: (
    entry: Omit<MoodEntry, "id" | "timestamp" | "status">
  ) => Promise<void>;
  
  updateEntry: (
    id: string,
    updates: Partial<Omit<MoodEntry, "id" | "timestamp" | "editHistory">>
  ) => void;
  
  resolveEntry: (id: string) => void;
  burnEntry: (id: string) => void;
  deleteEntry: (id: string) => Promise<void>;
  
  _setEntries: (entries: MoodEntry[]) => void;
  _loadEntries: () => Promise<void>;
  _saveEntries: () => void;
}
```

### UserModule

```typescript
export interface UserModule {
  user: User | null;
  
  register: (email: string, password: string, name: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  
  _setUser: (user: User | null) => void;
  _loadUser: () => Promise<void>;
  
  // firstEntryDate 管理
  initializeFirstEntryDate: () => Promise<void>;
  updateFirstEntryDate: (timestamp: number) => Promise<void>;
  clearFirstEntryDate: () => Promise<void>;
  _syncFirstEntryDateToCloud: () => Promise<void>;
  _syncFirstEntryDateFromCloud: () => Promise<void>;
}
```

### SyncModule

```typescript
export interface SyncModule {
  syncStatus: "idle" | "syncing" | "pending" | "error";
  
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  recoverFromCloud: () => Promise<boolean>;
}
```

### WeatherModule

```typescript
export interface WeatherModule {
  weather: WeatherState;
  _setWeather: (weather: WeatherState) => void;
  _calculateWeather: () => void;
}
```

### AIModule

```typescript
export interface AIModule {
  emotionForecast: EmotionForecast | null;
  emotionPodcast: EmotionPodcast | null;
  
  generateForecast: (days?: number) => Promise<void>;
  generatePodcast: (period?: "week" | "month") => Promise<void>;
  clearForecast: () => void;
  clearPodcast: () => void;
}
```

### AudioModule

```typescript
export interface AudioModule {
  // 播放状态
  currentAudioId: string | null;
  isPlaying: boolean;
  playbackPosition: number;
  duration: number;

  // 录音状态
  recordingState: RecordingState;
  recordingDuration: number;
  currentRecordingUri: string | null;

  // 播放控制
  playAudio: (audioId: string, uri: string) => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  seekTo: (position: number) => void;
  setPlaybackPosition: (position: number) => void;

  // 录音控制
  setRecordingState: (state: RecordingState) => void;
  setRecordingDuration: (duration: number) => void;
  setCurrentRecordingUri: (uri: string | null) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioData | null>;
  cancelRecording: () => void;
}

// 录音状态类型
export type RecordingState = 
  | 'idle'        // 空闲
  | 'recording'   // 正在录音
  | 'canceling'   // 取消录音
  | 'processing'  // 处理中
  | 'preview';    // 预览
```

## 组件 Props 接口

### EntryCardProps

```typescript
export interface EntryCardProps {
  entry: MoodEntry;
  onBurn?: (id: string) => void;
}
```

### RecordButtonProps

```typescript
interface RecordButtonProps {
  recordingState: RecordingState;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onRecordingCancel: () => void;
  disabled?: boolean;
}
```

## 常量接口 (constants.ts)

### MOOD_CONFIG

```typescript
export const MOOD_CONFIG = {
  [MoodLevel.ANNOYED]: {
    level: 1,
    iconName: 'Droplet',
    label: '有点委屈',
    iconColor: '#F59E0B',
  },
  // ... 其他等级
};
```

### DEADLINE_CONFIG

```typescript
export const DEADLINE_CONFIG = {
  [Deadline.TODAY]: {
    label: '今天谈',
    color: 'bg-red-100 text-red-700',
  },
  // ... 其他选项
};
```

## API 接口 (services/)

### audioSync.ts

```typescript
// 上传单个音频
export const uploadAudio = async (
  audioData: AudioData,
  userId: string
): Promise<{ success: boolean; remoteUrl?: string; error?: string }>;

// 批量上传待同步音频
export const uploadPendingAudios = async (
  audios: AudioData[],
  userId: string
): Promise<{
  success: number;
  failed: number;
  results: Map<string, string>;
}>;

// 下载单个音频
export const downloadAudio = async (
  audioId: string,
  userId: string
): Promise<{ success: boolean; localPath?: string; error?: string }>;

// 删除云端音频
export const deleteAudio = async (
  audioId: string,
  userId: string
): Promise<{ success: boolean; error?: string }>;
```

## 路由参数类型

### expo-router 路由

```typescript
// app/(tabs)/index.tsx - Dashboard 无参数

// app/record.tsx - Record 页无参数

// app/insights.tsx - Insights 页无参数

// app/profile.tsx - Profile 页无参数

// app/review-export.tsx
// 使用 useLocalSearchParams() 获取参数
```

---

*最后更新: 2026-04-20*
