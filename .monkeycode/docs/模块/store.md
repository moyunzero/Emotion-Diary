# Store 模块

## 概述

Zustand 状态管理，采用模块化 slice 设计。

## 目录结构

```
store/
├── useAppStore.ts       # 根 store (组合所有 slice)
└── modules/
    ├── types.ts        # 接口定义
    ├── entries.ts      # 条目管理
    ├── user.ts         # 用户认证
    ├── weather.ts      # 天气计算
    ├── ai.ts           # AI 功能
    ├── audio.ts        # 音频管理
    └── storage.ts      # 存储工具
```

## 模块接口

### entries (条目管理)

**职责**: MoodEntry 的增删改查、持久化

**状态**:
```typescript
entries: MoodEntry[]
```

**方法**:
```typescript
addEntry(entry)      // 添加条目
updateEntry(id, updates)  // 更新条目
resolveEntry(id)      // 标记已解决
burnEntry(id)         // 焚烧条目
deleteEntry(id)       // 删除条目
_setEntries(entries) // 批量设置
_loadEntries()        // 从存储加载
_saveEntries()        // 保存到存储
```

### user (用户管理)

**职责**: 认证、用户资料、firstEntryDate

**状态**:
```typescript
user: User | null
```

**方法**:
```typescript
register(email, password, name)
login(email, password)
logout()
deleteAccount()
updateUser(updates)
_setUser(user)
_loadUser()
initializeFirstEntryDate()
updateFirstEntryDate(timestamp)
_syncFirstEntryDateToCloud()
_syncFirstEntryDateFromCloud()
```

### weather (天气状态)

**职责**: 基于情绪数据计算天气

**状态**:
```typescript
weather: WeatherState
```

**方法**:
```typescript
_setWeather(weather)
_calculateWeather()
```

**计算规则**:
```typescript
// 基于最近 7 天条目计算
const recentEntries = entries.filter(
  e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
);

// 天气分数 = 平均情绪等级 × 20
// condition 根据阈值判断:
// - sunny: score >= 60
// - cloudy: 40 <= score < 60
// - rainy: 20 <= score < 40
// - stormy: score < 20
```

### audio (音频管理)

**职责**: 录音和播放状态

**状态**:
```typescript
recordingState: RecordingState  // idle | recording | canceling | processing | preview
recordingDuration: number
currentRecordingUri: string | null
currentAudioId: string | null
isPlaying: boolean
playbackPosition: number
duration: number
```

**方法**:
```typescript
playAudio(audioId, uri)
pauseAudio()
stopAudio()
seekTo(position)
setPlaybackPosition(position)
setRecordingState(state)
setRecordingDuration(duration)
setCurrentRecordingUri(uri)
startRecording()
stopRecording()
cancelRecording()
```

### ai (AI 功能)

**职责**: 情绪预测和播客生成

**状态**:
```typescript
emotionForecast: EmotionForecast | null
emotionPodcast: EmotionPodcast | null
```

**方法**:
```typescript
generateForecast(days?)
generatePodcast(period?)
clearForecast()
clearPodcast()
```

### storage (存储工具)

**职责**: AsyncStorage 读写封装

**方法**:
```typescript
getStorageKey(userId?)     // 获取存储键名
loadFromStorage(key)       // 读取数据
saveToStorage(key, data)    // 保存数据
migrateGuestDataToUser(guestData, userId)  // 迁移数据
```

## 防抖配置

| 操作 | 防抖时间 |
|------|----------|
| `_saveEntries` | 500ms |
| `syncToCloud` | 300ms |

## 初始化流程

```typescript
// app/_layout.tsx
useEffect(() => {
  const cleanup = initializeStore(); // 初始化 store
  return () => cleanup();  // 清理定时器
}, []);
```

---

*最后更新: 2026-04-20*
