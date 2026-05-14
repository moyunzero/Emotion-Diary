# 服务层规范

> **工程栈、目录、外部集成与风险**：不在本文件重复；见 [`engineering-system.md`](./engineering-system.md) §7、[`engineering-quality.md`](./engineering-quality.md) 文首。

本文档定义了情绪日记应用中的服务层规范，包括 AI 服务和 Supabase 服务。

## AI 服务（Groq API）

**文件路径**：`utils/aiService.ts`

### 概述

AI 服务使用 Groq API 提供情绪分析、预测和文本生成功能。Groq 提供免费、快速、稳定的 AI 推理服务，使用 Llama 3.1 8B 模型。

**与软删一致**：凡接收 `entries: MoodEntry[]` 的导出函数，在聚合统计或构造 prompt 前会先经 `excludeSoftDeletedEntries(entries)`（`shared/entries/visibility.ts`），避免已软删条目污染洞察与预测。

### 配置

```typescript
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';
```

### 缓存机制

- **缓存存储**：使用 `Map` 数据结构存储缓存
- **缓存键**：基于输入参数生成唯一键
- **缓存 TTL**：
  - 情绪预测：12小时
  - 情绪播客：24小时
  - 情绪处方：24小时
  - 情绪周期分析：24小时
- **缓存策略**：先检查缓存，命中则直接返回，未命中则调用 API 并缓存结果

### API 方法

#### analyzeEmotionCycle（情绪周期分析）

**签名**：
```typescript
export const analyzeEmotionCycle = async (
  entries: MoodEntry[]
): Promise<EmotionCycleAnalysis>
```

**功能说明**：
- 基于历史数据识别周期性模式和触发因素
- 分析情绪在时间和触发因素上的分布

**参数**：
- `entries`：情绪记录数组（至少5条记录）

**返回值**：
```typescript
interface EmotionCycleAnalysis {
  patterns: {
    dayOfWeek?: string;
    timeOfDay?: string;
    frequency: number;
  }[];
  highRiskPeriods: {
    period: string;
    riskLevel: 'high' | 'medium' | 'low';
    description: string;
  }[];
  triggerFactors: {
    trigger: string;
    frequency: number;
    avgMoodLevel: number;
  }[];
}
```

**算法**：
1. 统计每天的情绪记录数量
2. 统计每个时间段（上午/下午/晚上）的情绪记录数量
3. 统计每个触发因素的频率和平均情绪等级
4. 识别高风险时间段（频率 ≥ 总记录的20%）
5. 返回 Top 5 触发因素

**错误处理**：
- 如果记录不足5条，返回空分析
- 如果分析失败，返回空分析并记录错误

#### predictEmotionTrend（情绪趋势预测）

**签名**：
```typescript
export const predictEmotionTrend = async (
  entries: MoodEntry[],
  days: number = 7
): Promise<EmotionForecast>
```

**功能说明**：
- 基于历史数据预测未来情绪走势
- 识别高风险日期并生成警告

**参数**：
- `entries`：情绪记录数组
- `days`：预测天数（默认7天）

**返回值**：
```typescript
interface EmotionForecast {
  predictions: {
    date: string;                    // YYYY-MM-DD
    predictedMoodLevel: number;      // 1-5
    confidence: number;              // 0-1
    riskLevel: 'high' | 'medium' | 'low';
  }[];
  warnings: {
    date: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  summary: string;
}
```

**算法**：
1. 调用 `analyzeEmotionCycle` 获取周期分析
2. 计算平均情绪等级
3. 对每一天：
   - 根据周期分析确定是否为高风险日期
   - 预测情绪等级（高风险日期 = 平均等级 + 1）
   - 生成警告（如果为高风险）
4. 生成预测摘要

**错误处理**：
- 如果预测失败，返回空预测并记录错误

#### generateEmotionPodcast（情绪播客生成）

**签名**：
```typescript
export const generateEmotionPodcast = async (
  entries: MoodEntry[],
  period: 'week' | 'month' = 'week'
): Promise<string | null>
```

**功能说明**：
- 使用 AI 生成个性化情绪疗愈播客内容
- 基于用户的历史情绪记录生成

**参数**：
- `entries`：情绪记录数组
- `period`：时间周期（'week' 或 'month'）

**返回值**：
- `string | null`：播客内容（Markdown 格式）或 `null`

**行为**：
1. 筛选最近周期的记录（7天或30天）
2. 调用 Groq API 生成播客内容
3. 使用系统提示词和用户提示词
4. 返回生成的文本

**错误处理**：
- 如果 API Key 无效，返回默认内容
- 如果记录为空，返回提示文本
- 如果生成失败，返回默认内容

#### generateEmotionPrescription（情绪处方生成）

**签名**：
```typescript
export const generateEmotionPrescription = async (
  trigger: string,
  moodLevel: MoodLevel,
  entries: MoodEntry[]
): Promise<EmotionPrescription>
```

**功能说明**：
- 针对特定触发器生成个性化建议和应对策略
- 提供紧急、短期和长期建议

**参数**：
- `trigger`：情绪触发器
- `moodLevel`：情绪等级
- `entries`：情绪记录数组

**返回值**：
```typescript
interface EmotionPrescription {
  urgent: string;      // 紧急建议（立即执行）
  shortTerm: string;   // 短期建议（今天内执行）
  longTerm: string;    // 长期建议（持续改善）
}
```

**行为**：
1. 调用 Groq API 生成处方
2. 使用系统提示词和用户提示词
3. 解析返回的文本为三个建议
4. 返回结构化数据

**错误处理**：
- 如果 API Key 无效，返回默认处方
- 如果生成失败，返回默认处方

### 错误处理

#### 错误类型

```typescript
enum AIErrorType {
  NO_TOKEN = 'NO_TOKEN',           // 未配置 Token
  INVALID_TOKEN = 'INVALID_TOKEN', // Token 无效
  RATE_LIMIT = 'RATE_LIMIT',       // 请求频率限制
  MODEL_ERROR = 'MODEL_ERROR',     // 模型不可用
  NETWORK_ERROR = 'NETWORK_ERROR', // 网络错误
  UNKNOWN = 'UNKNOWN',             // 未知错误
}
```

#### 重试机制

- **重试次数**：最多重试2次
- **重试延迟**：1秒（频率限制时延迟3倍）
- **不重试的错误**：Token 无效、模型错误
- **特殊处理**：频率限制错误等待更长时间

### API Key 验证

```typescript
const isApiKeyValid = (): boolean => {
  return GROQ_API_KEY.length > 0 && (
    GROQ_API_KEY.startsWith('gsk_') || 
    GROQ_API_KEY.length > 20
  );
};
```

### 离线支持

- 如果 API Key 未配置或无效，使用默认内容
- 默认内容基于规则生成，不依赖 API
- 确保应用在离线状态下也能正常使用

## Supabase 服务

**文件路径**：`lib/supabase.ts`

### 概述

Supabase 服务提供数据库连接、用户认证和数据同步功能。使用 Supabase 作为可选的云端数据存储和用户认证服务。

### 配置

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
```

### 客户端创建

```typescript
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

### SecureStore 适配器

为了在 React Native 中使用 Supabase Auth，需要将 SecureStore 适配为 Supabase 期望的存储格式。

```typescript
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore getItem failed for key ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`SecureStore setItem failed for key ${key}:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore removeItem failed for key ${key}:`, error);
    }
  },
};
```

**错误处理**：
- 所有操作都使用 try-catch 包裹
- 错误时记录警告但不抛出异常
- 确保应用在 SecureStore 失败时也能继续运行

### 配置检查

```typescript
export const isSupabaseConfigured = (): boolean => {
  return !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co'
  );
};
```

**行为**：
- 检查环境变量是否配置
- 检查是否使用占位符值
- 返回配置是否有效

### 数据库表结构

#### entries 表

存储用户的情绪记录数据。

**字段**：
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key -> auth.users.id)
- `timestamp` (bigint)
- `mood_level` (integer)
- `content` (text)
- `deadline` (text)
- `people` (text[])
- `triggers` (text[])
- `status` (text)
- `resolved_at` (bigint, nullable)
- `edit_history` (jsonb, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### profiles 表

存储用户的个人信息。

**字段**：
- `id` (uuid, primary key, foreign key -> auth.users.id)
- `name` (text)
- `email` (text, nullable)
- `avatar` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 行级安全（RLS）策略

- **entries 表**：
  - 用户只能读取和写入自己的记录
  - 使用 `user_id = auth.uid()` 作为策略条件

- **profiles 表**：
  - 用户只能读取和写入自己的 profile
  - 使用 `id = auth.uid()` 作为策略条件

### 数据同步

#### 同步到云端（syncToCloud）

- 批量上传本地所有记录到 Supabase
- 处理冲突（以本地数据为准）
- 使用 UPSERT 操作（存在则更新，不存在则插入）
- 错误处理：记录错误但不抛出异常

#### 从云端同步（syncFromCloud）

- 从 Supabase 获取用户的所有记录
- 与本地数据合并（以云端数据为准）
- 更新本地存储和状态
- 错误处理：记录错误但不抛出异常

### 用户认证

#### 注册（register）

- 使用 `supabase.auth.signUp` 注册用户
- 将用户名存储到用户元数据
- 注册成功后自动登录

#### 登录（login）

- 使用 `supabase.auth.signInWithPassword` 登录
- 从用户元数据或 profiles 表获取用户信息
- 更新用户状态

#### 登出（logout）

- 使用 `supabase.auth.signOut` 登出
- 清除用户状态
- 加载游客数据

### 错误处理

- **网络错误**：记录错误但不抛出异常，允许应用继续运行
- **认证错误**：返回 false 或抛出异常（由调用方处理）
- **数据库错误**：记录错误但不抛出异常
- **配置错误**：记录警告但不抛出异常，允许应用以离线模式运行

### 离线支持

- 如果 Supabase 未配置，应用以离线模式运行
- 所有数据存储在本地 AsyncStorage
- 用户可以正常使用所有功能，只是不能同步到云端
- 配置 Supabase 后可以启用云端同步功能

### 初始化

```typescript
const initializeDatabase = async () => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase 未配置，跳过数据库初始化');
    return;
  }

  try {
    // 检查 profiles 表是否存在
    const { error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (checkError) {
      // 记录警告但不抛出异常
      console.warn('Database initialization check failed:', checkError.message);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // 不重新抛出错误，允许应用以离线模式继续运行
  }
};
```

**行为**：
- 检查 Supabase 是否配置
- 检查数据库表是否存在
- 错误时不抛出异常，允许应用继续运行

## 服务使用示例

### AI 服务使用

```typescript
import { predictEmotionTrend, generateEmotionPodcast } from '../utils/aiService';

// 生成情绪预测
const forecast = await predictEmotionTrend(entries, 7);

// 生成情绪播客
const podcast = await generateEmotionPodcast(entries, 'week');
```

### Supabase 服务使用

```typescript
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// 检查配置
if (isSupabaseConfigured()) {
  // 使用 Supabase 功能
  const { data, error } = await supabase
    .from('entries')
    .select('*');
}
```

