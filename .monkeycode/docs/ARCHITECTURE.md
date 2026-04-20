# 系统架构文档

## 概述

心晴MO采用**离线优先 + 云端同步**的架构设计，基于 React Native (Expo) 构建。核心原则是：

1. **离线可用** - 应用在无网络时完全可用
2. **数据安全** - 本地存储优先，云端作为备份和同步
3. **模块化** - 清晰的状态管理和模块划分

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Dashboard  │  │   Record    │  │  Insights   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│  ┌──────┴────────────────┴────────────────┴──────┐         │
│  │              React Components                   │         │
│  │   EntryCard │ MoodForm │ AudioRecorder │ ...   │         │
│  └──────────────────────┬─────────────────────────┘         │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    Hooks Layer                               │
│  ┌──────────────────────┴─────────────────────────┐         │
│  │        useAppStore (Zustand)                   │         │
│  └──────────────────────┬─────────────────────────┘         │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                  Store Modules                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ entries │ │  user   │ │ weather │ │   ai    │ │  audio  │ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ │
└───────┼───────────┼───────────┼───────────┼───────────┼───────┘
        │           │           │           │           │
┌───────┼───────────┼───────────┼───────────┼───────────┼───────┐
│       │     Service Layer     │           │           │       │
│  ┌────┴────────────────────────┴────┐  ┌───┴───┐  ┌───┴───┐ │
│  │         audioSync.ts             │  │ AI    │  │ sync  │ │
│  │    (upload/download audio)        │  │Service│  │logic  │ │
│  └──────────────┬───────────────────┘  └───────┘  └───────┘ │
└─────────────────┼───────────────────────────────────────────┘
                  │
┌─────────────────┼───────────────────────────────────────────┐
│            Storage Layer                                     │
│  ┌──────────────┴───────────────────────┐                   │
│  │        AsyncStorage (Local)           │                   │
│  │  - entries: MoodEntry[]                │                   │
│  │  - user: User                          │                   │
│  │  - settings                             │                   │
│  └──────────────────────┬─────────────────┘                   │
│                         │                                     │
│  ┌──────────────────────┴─────────────────┐                   │
│  │        Supabase (Cloud)                 │                   │
│  │  - Auth                                 │                   │
│  │  - Database (entries, users)           │                   │
│  │  - Storage (audio files)               │                   │
│  └────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 状态管理 (Store)

采用 Zustand 模块化设计，所有状态通过单一的 `useAppStore` 暴露。

```
Store Structure:
├── entries module     # 情绪条目 CRUD
├── user module        # 用户认证和资料
├── weather module     # 天气状态计算
├── ai module         # AI 功能和预测
├── audio module       # 音频录制和播放
└── sync module        # 云端同步逻辑
```

详细见 [模块/store.md](./模块/store.md)

### 2. 路由系统

使用 expo-router 实现基于文件的路由系统：

```
app/
├── _layout.tsx           # 根布局 (GestureHandler, SafeArea, Stack)
├── (tabs)/               # Tab 导航组
│   ├── index.tsx         # / - 首页 Dashboard
│   ├── record.tsx        # /record - 记录页
│   └── insights.tsx      # /insights - 洞察页
├── profile.tsx           # /profile - 个人页
└── review-export.tsx     # /review-export - 回顾导出
```

### 3. 组件架构

组件按职责分为：

| 目录 | 职责 | 示例 |
|------|------|------|
| `components/` | 通用 UI 组件 | EntryCard, MoodForm |
| `components/AudioRecorder/` | 录音功能 | AudioRecorder, RecordButton |
| `components/Insights/` | 数据洞察展示 | EmotionReleaseArchive |
| `components/ReviewExport/` | 回顾导出 | ReviewExportCanvas |
| `features/profile/` | 功能模块 | ProfileScreen |

### 4. 数据流

```
User Action
     │
     ▼
Component ──────────────────┐
     │                       │
     ▼                       │
  useAppStore()              │
     │                       │
     ├── entries.slice ──────►│──► AsyncStorage (本地)
     │                       │         │
     │                       │         ▼
     │                       │   Supabase (云端)
     │                       │         │
     │◄──────────────────────┘         │
     │                                 │
     ▼                                 ▼
  UI Update ◄───────────────── Sync Status
```

## 数据模型

### MoodEntry (情绪条目)

```typescript
interface MoodEntry {
  id: string;
  timestamp: number;           // 创建时间
  moodLevel: MoodLevel;       // 情绪等级 1-5
  content: string;             // 日记内容
  deadline: string;            // 截止日期
  people: string[];            // 相关人物
  triggers: string[];          // 触发因素
  status: Status;              // active | resolved | burned
  resolvedAt?: number;
  burnedAt?: number;
  editHistory?: EditHistory[];
  audios?: AudioData[];        // 语音附件
  intensity?: 1-5;             // 情绪强度
  syncStatus?: SyncStatus;     // 同步状态
}
```

### User (用户)

```typescript
interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  firstEntryDate?: number;     // 第一条记录时间
}
```

### AudioData (音频)

```typescript
interface AudioData {
  id: string;
  localUri: string;             // 本地路径
  remoteUrl?: string;           // 云端路径
  duration: number;             // 时长(秒)
  fileSize: number;             // 文件大小
  fileHash: string;             // MD5 哈希
  name?: string;
  createdAt: number;
  syncStatus: SyncStatus;
}
```

## 云端同步策略

### 同步原则

1. **本地优先** - 所有操作先作用于本地存储
2. **最终一致** - 网络恢复后自动同步到云端
3. **冲突处理** - 以本地数据为准（待优化）

### 同步流程

```
┌─────────────┐
│  User Action │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Local Write │────►│ AsyncStorage │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ (debounced 300ms) │
       ▼                   │
┌─────────────┐            │
│  Sync Queue │            │
└──────┬──────┘            │
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│         Supabase                │
│  - Upload pending entries        │
│  - Upload pending audio files    │
│  - Download cloud changes        │
└─────────────────────────────────┘
```

### 音频同步

音频文件单独管理：

1. **上传**: 本地录制 → 上传到 Supabase Storage → 更新条目 remoteUrl
2. **下载**: 从 Storage 下载 → 缓存本地 → 播放
3. **去重**: 使用 MD5 哈希检测重复文件

## AI 功能

### 情绪预测

```
输入: entries[] (最近 N 天的情绪数据)
     ↓
Groq API (llama-3.3-70b)
     ↓
输出: EmotionForecast {
        predictions: [{ date, predictedMoodLevel, confidence, riskLevel }],
        warnings: [{ date, message, severity }],
        summary: string
      }
```

### 情绪播客

```
输入: period ('week' | 'month')
     ↓
Groq API (llama-3.3-70b)
     ↓
输出: EmotionPodcast {
        content: string,
        period: 'week' | 'month',
        generatedAt: number
      }
```

## 性能优化

### 1. 列表优化

使用 `@shopify/flash-list` 实现高性能列表：

```typescript
<FlashList
  data={entries}
  renderItem={renderItem}
  estimatedItemSize={120}
  keyExtractor={item => item.id}
/>
```

### 2. 组件记忆化

- `EntryCard` 使用 `React.memo` + 自定义比较函数
- `useCallback` 缓存回调函数
- `useMemo` 缓存计算结果

### 3. 防抖策略

| 操作 | 防抖时间 | 说明 |
|------|----------|------|
| 保存条目 | 500ms | 合并快速编辑 |
| 同步请求 | 300ms | 合并同步触发 |
| 天气计算 | - | 即时计算 |

## 错误处理

### 错误分类

```typescript
type ErrorType = 'network' | 'auth' | 'storage' | 'unknown';
```

### 降级策略

1. **网络错误** → 使用本地缓存，继续可用
2. **认证错误** → 清除会话，引导重新登录
3. **存储错误** → 提示用户，尝试恢复
4. **未知错误** → 记录日志，静默恢复

---

*最后更新: 2026-04-20*
