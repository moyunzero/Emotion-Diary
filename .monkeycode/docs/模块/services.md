# Services 文档

## 概述

业务服务层，处理核心业务逻辑和数据同步。

## 目录结构

```
services/
├── audioSync.ts             # 音频云端同步
└── companionDaysService.ts  # 陪伴天数计算
```

## audioSync.ts

### 职责

管理音频文件的云端上传、下载和同步状态。

### API

#### uploadAudio

上传单个音频文件到 Supabase Storage。

```typescript
uploadAudio(
  audioData: AudioData,
  userId: string
): Promise<{
  success: boolean;
  remoteUrl?: string;
  error?: string;
}>
```

**流程**:
1. 检查 Supabase 配置
2. 验证本地文件存在
3. 上传到 Storage (`audios/{userId}/{audioId}.m4a`)
4. 获取公共 URL
5. 返回结果

#### uploadPendingAudios

批量上传待同步的音频。

```typescript
uploadPendingAudios(
  audios: AudioData[],
  userId: string
): Promise<{
  success: number;
  failed: number;
  results: Map<string, string>; // audioId → remoteUrl
}>
```

**特性**:
- 最多重试 3 次
- 返回成功/失败数量
- 返回 audioId 到 remoteUrl 的映射

#### downloadAudio

下载云端音频到本地。

```typescript
downloadAudio(
  audioId: string,
  userId: string
): Promise<{
  success: boolean;
  localPath?: string;
  error?: string;
}>
```

**流程**:
1. 从 Storage 下载到缓存目录
2. 返回本地路径

#### deleteAudio

删除云端音频。

```typescript
deleteAudio(
  audioId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
}>
```

### 常量

```typescript
const AUDIO_BUCKET = 'audios';
const MAX_RETRY_COUNT = 3;
```

## companionDaysService.ts

### 职责

计算用户陪伴天数（从第一条情绪记录开始）。

### API

#### getCompanionDays

获取陪伴天数。

```typescript
getCompanionDays(firstEntryDate: number): number
```

**计算逻辑**:
```typescript
const msPerDay = 24 * 60 * 60 * 1000;
const daysSinceFirstEntry = Math.floor(
  (Date.now() - firstEntryDate) / msPerDay
);
return daysSinceFirstEntry + 1; // 包含第一天
```

### 界面展示

陪伴天数显示在个人中心首页，格式如：`已陪伴 42 天`

---

*最后更新: 2026-04-20*
