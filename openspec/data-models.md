# 数据模型规范

> **工程栈、目录、集成与风险**：不在本文件重复；见 [`engineering-system.md`](./engineering-system.md)、[`engineering-quality.md`](./engineering-quality.md) 文首说明。

本文档定义了情绪日记应用中的所有核心数据模型和类型定义。

## MoodEntry（情绪记录）

情绪记录是应用的核心数据模型，用于存储用户的情绪记录信息。

### 数据结构

```typescript
interface MoodEntry {
  id: string;                    // 唯一标识符（UUID v4 字符串，见 `generateEntryId`）
  timestamp: number;             // 创建时间戳（毫秒）
  moodLevel: MoodLevel;          // 情绪等级（1-5）
  content: string;               // 情绪内容描述
  deadline: string;              // 处理期限（支持自定义值）
  people: string[];              // 相关人物标签数组
  triggers: string[];            // 情绪触发器标签数组
  status: Status;                // 状态（含 active / processing / resolved / burned）
  resolvedAt?: number;           // 解决时间戳（毫秒，可选）
  burnedAt?: number;             // 焚烧时间戳（毫秒，可选）
  editHistory?: EditHistory[];  // 编辑历史记录数组（可选）
  audios?: AudioData[];          // 语音附件（可选）
  intensity?: 1 | 2 | 3 | 4 | 5; // 情绪强度（可选）
  syncStatus?: SyncStatus;      // 同步状态（可选）
  deletedAt?: number | null;     // 软删除时间戳（毫秒）；未删除为 undefined / null
}
```

### 字段说明

#### id

- **类型**：`string`
- **格式**：UUID v4（8-4-4-4-12 十六进制，RFC 4122 变体）
- **生成方式**：`shared/entries/visibility.ts` 中的 `generateEntryId()`（`addEntry` 调用）
- **用途**：跨设备、游客迁登录的稳定主键；与 Supabase `entries.id`、墓碑 `entry_id` 对齐
- **说明**：历史本地数据可能仍为旧版时间戳字符串 id，读写层不做强制改写

#### timestamp

- **类型**：`number`
- **格式**：Unix 时间戳（毫秒）
- **生成方式**：使用 `Date.now()` 或 `Date.getTime()`
- **用途**：记录创建时间，用于排序和筛选

#### moodLevel

- **类型**：`MoodLevel`（枚举）
- **值**：
  - `MoodLevel.ANNOYED = 1`：有点委屈
  - `MoodLevel.UPSET = 2`：心情低落
  - `MoodLevel.ANGRY = 3`：感到生气
  - `MoodLevel.FURIOUS = 4`：非常愤怒
  - `MoodLevel.EXPLOSIVE = 5`：情绪爆发
- **用途**：标识情绪强度等级

#### content

- **类型**：`string`
- **限制**：非空字符串
- **用途**：用户输入的情绪描述文本

#### deadline

- **类型**：`string`
- **格式**：支持枚举值和自定义字符串
- **枚举值**：
  - `'today'`：今天谈
  - `'week'`：本周内
  - `'month'`：本月内
  - `'later'`：以后说
  - `'self'`：自己消化
- **用途**：标识处理该情绪的期限

#### people

- **类型**：`string[]`
- **格式**：字符串数组
- **示例**：`['男朋友', '朋友', '其他']`
- **用途**：标识与该情绪相关的人物

#### triggers

- **类型**：`string[]`
- **格式**：字符串数组
- **示例**：`['工作', '沟通', '信任']`
- **用途**：标识触发该情绪的因素

#### status

- **类型**：`Status`（枚举）
- **值**：
  - `Status.ACTIVE = 'active'`：活跃（待处理）
  - `Status.PROCESSING = 'processing'`：处理中
  - `Status.RESOLVED = 'resolved'`：已解决
  - `Status.BURNED = 'burned'`：已焚烧（`burnedAt` 记录时刻）
- **用途**：标识情绪记录的处理状态

#### resolvedAt

- **类型**：`number | undefined`
- **格式**：Unix 时间戳（毫秒）
- **可选性**：可选字段
- **用途**：记录情绪解决的时间，仅在 `status === 'resolved'` 时设置

#### burnedAt

- **类型**：`number | undefined`
- **用途**：焚烧动画完成后的时间戳；与 `status === 'burned'` 配合

#### deletedAt（软删除）

- **类型**：`number | null | undefined`
- **语义**：为正毫秒时间戳表示用户已「删除」该条（软删）；权威存储（`entries` 数组 / AsyncStorage / 云端行）仍保留该 `id`
- **可见性**：主列表、天气、洞察、统计、AI 输入等默认使用 `excludeSoftDeletedEntries` / `isSoftDeleted`（`shared/entries/visibility.ts`）过滤
- **云端列名**：Supabase `entries.deletedat`（`bigint`，与 `moodlevel` / `resolvedat` 等无下划线命名一致）；同步映射见 `store/useAppStore.ts`

#### editHistory

- **类型**：`EditHistory[] | undefined`
- **格式**：编辑历史记录数组
- **可选性**：可选字段
- **用途**：记录每次编辑的历史信息

### EditHistory（编辑历史）

记录每次编辑操作的历史信息。

```typescript
interface EditHistory {
  editedAt: number;              // 编辑时间戳（毫秒）
  previousContent: string;       // 编辑前的内容
  previousMoodLevel: MoodLevel;  // 编辑前的情绪等级
  previousDeadline: string;      // 编辑前的期限
  previousPeople: string[];      // 编辑前的人物标签
  previousTriggers: string[];    // 编辑前的触发器标签
}
```

### 业务规则

1. **创建规则**：
   - 创建时必须包含 `id`、`timestamp`、`moodLevel`、`content`、`deadline`、`people`、`triggers`
   - `status` 默认为 `Status.ACTIVE`
   - `timestamp` 自动设置为当前时间

2. **更新规则**：
   - 更新时保留 `id` 和 `timestamp` 不变
   - 每次更新都会在 `editHistory` 中添加一条历史记录
   - 更新后的数据会覆盖原有数据

3. **删除规则（软删）**：
   - `deleteEntry` 仅设置 `deletedAt`，**不**从 `entries` 数组 `filter` 移除
   - **不**写入 `entry_tombstones`（墓碑仅永久删云 / 销户等路径）

4. **状态转换规则**：
   - `active` → `processing`：开始处理
   - `processing` → `resolved`：标记为已解决（同时设置 `resolvedAt`）
   - `resolved` → `active`：重新激活（清除 `resolvedAt`）

5. **数据验证规则**：
   - `content` 不能为空
   - `moodLevel` 必须在 1-5 之间
   - `people` 和 `triggers` 可以为空数组，但不能为 null

## User（用户）

用户信息模型，用于存储用户的基本信息。

### 数据结构

```typescript
interface User {
  id: string;              // 用户唯一标识符（Supabase UUID）
  name: string;            // 用户名称
  email?: string;          // 邮箱（可选）
  avatar?: string;         // 头像 URL（可选）
  firstEntryDate?: number; // 首条记录日（毫秒，陪伴天数等用）
}
```

### 字段说明

#### id

- **类型**：`string`
- **格式**：Supabase 生成的 UUID
- **来源**：Supabase Auth 用户 ID
- **用途**：用户唯一标识符

#### name

- **类型**：`string`
- **限制**：非空字符串
- **用途**：用户显示名称

#### email

- **类型**：`string | undefined`
- **可选性**：可选字段
- **用途**：用户邮箱地址

#### avatar

- **类型**：`string | undefined`
- **格式**：URL 字符串
- **可选性**：可选字段
- **用途**：用户头像图片 URL

### 业务规则

1. 用户数据存储在 Supabase 数据库中
2. 未登录用户使用 `null` 表示
3. 用户信息与情绪记录关联（通过 `id`）

## WeatherState（情绪天气状态）

情绪天气状态模型，用于可视化显示当前的关系健康状态。

### 数据结构

```typescript
interface WeatherState {
  score: number;                              // 情绪指数（0-100+）
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';  // 天气状况
  description: string;                        // 描述文本
}
```

### 字段说明

#### score

- **类型**：`number`
- **范围**：0-100+
- **计算方式**：基于最近的活跃情绪记录计算
- **用途**：情绪指数的数值表示

#### condition

- **类型**：字面量联合类型
- **值**：
  - `'sunny'`：晴天（情绪良好）
  - `'cloudy'`：多云（情绪一般）
  - `'rainy'`：雨天（情绪较差）
  - `'stormy'`：风暴（情绪很差）
- **计算方式**：根据 `score` 和阈值计算
- **用途**：天气状况的视觉表示

#### description

- **类型**：`string`
- **格式**：描述性文本
- **用途**：对当前天气状况的文字描述

### 业务规则

1. **计算规则**：
   - 基于 **`status === Status.ACTIVE` 且未软删**（`!isSoftDeleted(entry)`，`store/modules/weather.ts`）的条目
   - 根据情绪等级和时间权重计算 `score`
   - 根据 `score` 和阈值确定 `condition`

2. **阈值设置**：
   - `sunny`：score < 阈值1
   - `cloudy`：阈值1 ≤ score < 阈值2
   - `rainy`：阈值2 ≤ score < 阈值3
   - `stormy`：score ≥ 阈值3

3. **更新时机**：
   - 新增情绪记录时
   - 更新情绪记录状态时
   - 删除情绪记录时

## EmotionForecast（AI 情绪预测）

AI 生成的情绪预测数据模型。

### 数据结构

```typescript
interface EmotionForecast {
  predictions: {
    date: string;                    // 日期（YYYY-MM-DD）
    predictedMoodLevel: number;      // 预测的情绪等级（1-5）
    confidence: number;              // 置信度（0-1）
    riskLevel: 'high' | 'medium' | 'low';  // 风险等级
  }[];
  warnings: {
    date: string;                    // 日期（YYYY-MM-DD）
    message: string;                 // 警告信息
    severity: 'high' | 'medium' | 'low';  // 严重程度
  }[];
  summary: string;                   // 预测摘要
  lastUpdated?: number;              // 最后更新时间戳（毫秒，可选）
}
```

### 字段说明

#### predictions

- **类型**：预测对象数组
- **长度**：通常为 7 天
- **用途**：未来情绪走势的预测数据

#### warnings

- **类型**：警告对象数组
- **用途**：高风险时期的警告信息

#### summary

- **类型**：`string`
- **格式**：文本摘要
- **用途**：对预测结果的文字总结

#### lastUpdated

- **类型**：`number | undefined`
- **格式**：Unix 时间戳（毫秒）
- **可选性**：可选字段
- **用途**：记录预测数据的生成时间

### 业务规则

1. 预测数据由 AI 服务生成
2. 预测周期通常为未来 7 天
3. 预测数据会缓存 24 小时
4. 用户可以通过刷新操作重新生成预测

## EmotionPodcast（AI 情绪播客）

AI 生成的情绪播客内容模型。

### 数据结构

```typescript
interface EmotionPodcast {
  content: string;                  // 播客内容文本
  period: 'week' | 'month';        // 时间周期
  generatedAt: number;             // 生成时间戳（毫秒）
}
```

### 字段说明

#### content

- **类型**：`string`
- **格式**：Markdown 格式的文本
- **用途**：播客的主要内容

#### period

- **类型**：字面量联合类型
- **值**：
  - `'week'`：本周
  - `'month'`：本月
- **用途**：标识播客内容覆盖的时间周期

#### generatedAt

- **类型**：`number`
- **格式**：Unix 时间戳（毫秒）
- **用途**：记录播客内容的生成时间

### 业务规则

1. 播客内容由 AI 服务基于用户的历史情绪记录生成
2. 用户可以选择生成本周或本月的播客
3. 播客内容会缓存 24 小时
4. 用户可以通过刷新操作重新生成播客

## 枚举类型

### MoodLevel（情绪等级）

```typescript
enum MoodLevel {
  ANNOYED = 1,      // 有点委屈
  UPSET = 2,        // 心情低落
  ANGRY = 3,        // 感到生气
  FURIOUS = 4,      // 非常愤怒
  EXPLOSIVE = 5,    // 情绪爆发
}
```

### Status（状态）

```typescript
enum Status {
  ACTIVE = 'active',        // 活跃（待处理）
  PROCESSING = 'processing', // 处理中
  RESOLVED = 'resolved',     // 已解决
}
```

### Deadline（期限）

```typescript
enum Deadline {
  TODAY = 'today',        // 今天谈
  THIS_WEEK = 'week',     // 本周内
  THIS_MONTH = 'month',   // 本月内
  LATER = 'later',        // 以后说
  SELF_DIGEST = 'self',   // 自己消化
}
```

## 数据存储

### 本地存储（AsyncStorage）

- **键名格式**：`mood_entries_${userId}`（登录用户）或 `mood_entries_guest`（游客）
- **存储格式**：JSON 字符串
- **数据同步**：实时保存到本地

### 云端存储（Supabase）

- **表名**：`entries`
- **字段映射**：与 `MoodEntry` 接口对应
- **数据同步**：可选，需要用户登录

### 数据迁移

- 支持从旧版本数据迁移
- 支持游客数据与登录用户数据的迁移
- 迁移过程自动处理，用户无感知
