# 状态管理规范

> **工程栈、目录、集成与风险**：不在本文件重复；见 [`engineering-system.md`](./engineering-system.md)、[`engineering-quality.md`](./engineering-quality.md) 文首说明。

本文档定义了情绪日记应用中的状态管理架构和 Zustand Store 规范。

## 架构概述

应用使用 **Zustand** 作为状态管理库，替代了传统的 Context API，提供更好的性能和可维护性。

### 为什么选择 Zustand？

- **轻量级**：体积小，性能高
- **简单易用**：API 简洁，学习成本低
- **类型安全**：完整的 TypeScript 支持
- **不需要 Provider**：可以在任何地方使用，无需包装组件

## Store 接口定义

```typescript
interface AppStore {
  // 状态
  entries: MoodEntry[];
  user: User | null;
  weather: WeatherState;
  emotionForecast: EmotionForecast | null;
  emotionPodcast: EmotionPodcast | null;
  
  // 操作方法
  addEntry: (entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Omit<MoodEntry, 'id' | 'timestamp' | 'editHistory'>>) => void;
  resolveEntry: (id: string) => void;
  burnEntry: (id: string) => void;
  deleteEntry: (id: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  recoverFromCloud: () => Promise<boolean>;
  
  // AI相关方法
  generateForecast: (days?: number) => Promise<void>;
  generatePodcast: (period?: 'week' | 'month') => Promise<void>;
  clearForecast: () => void;
  clearPodcast: () => void;
  
  // 内部方法（不对外暴露）
  _setEntries: (entries: MoodEntry[]) => void;
  _setUser: (user: User | null) => void;
  _setWeather: (weather: WeatherState) => void;
  _loadEntries: () => Promise<void>;
  _loadUser: () => Promise<void>;
  _calculateWeather: () => void;
  _saveEntries: () => void;
}
```

## 状态说明

### entries
- **类型**：`MoodEntry[]`
- **说明**：所有情绪记录的数组
- **初始值**：`[]`
- **存储**：本地 AsyncStorage + 可选 Supabase
- **更新时机**：
  - 新增记录时
  - 更新记录时
  - 删除记录时
  - 同步数据时

### user
- **类型**：`User | null`
- **说明**：当前登录用户信息
- **初始值**：`null`
- **存储**：Supabase Auth + profiles 表
- **更新时机**：
  - 用户登录时
  - 用户注册时
  - 用户登出时（设为 `null`）
  - 更新用户信息时

### weather
- **类型**：`WeatherState`
- **说明**：情绪天气状态（基于活跃记录计算）
- **初始值**：
  ```typescript
  {
    score: 0,
    condition: 'sunny',
    description: '关系晴朗'
  }
  ```
- **计算方式**：基于活跃情绪记录（`status === 'active'`）计算
- **更新时机**：
  - 新增记录后
  - 更新记录状态后
  - 删除记录后
  - 加载记录后

### emotionForecast
- **类型**：`EmotionForecast | null`
- **说明**：AI 生成的情绪预测数据
- **初始值**：`null`
- **生成方式**：调用 AI 服务生成
- **更新时机**：
  - 用户主动生成预测时
  - 清除预测时（设为 `null`）

### emotionPodcast
- **类型**：`EmotionPodcast | null`
- **说明**：AI 生成的情绪播客内容
- **初始值**：`null`
- **生成方式**：调用 AI 服务生成
- **更新时机**：
  - 用户主动生成播客时
  - 清除播客时（设为 `null`）

## 操作方法规范

### 情绪记录操作

#### addEntry
- **签名**：`(entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => Promise<void>`
- **说明**：添加新的情绪记录
- **参数**：
  - `entry`：情绪记录数据（不包含 `id`、`timestamp`、`status`）
- **行为**：
  1. 自动生成 `id`：`generateEntryId()`（UUID v4，`shared/entries/visibility.ts`）
  2. 自动设置 `timestamp`（使用 `Date.now()`）
  3. 自动设置 `status` 为 `Status.ACTIVE`
  4. 将新记录添加到 `entries` 数组开头
  5. 保存到本地（防抖 500ms）
  6. 重新计算天气状态
- **副作用**：更新 `entries`、触发 `_saveEntries`、触发 `_calculateWeather`

#### updateEntry
- **签名**：`(id: string, updates: Partial<Omit<MoodEntry, 'id' | 'timestamp' | 'editHistory'>>) => void`
- **说明**：更新情绪记录（支持编辑历史）
- **参数**：
  - `id`：记录唯一标识符
  - `updates`：要更新的字段（部分更新）
- **行为**：
  1. 查找对应的记录
  2. 创建编辑历史记录（保存更新前的状态）
  3. 合并更新数据
  4. 将编辑历史添加到 `editHistory` 数组
  5. 更新 `entries` 数组
  6. 保存到本地（防抖 500ms）
  7. 重新计算天气状态
- **副作用**：更新 `entries`、触发 `_saveEntries`、触发 `_calculateWeather`
- **错误处理**：如果记录不存在，记录错误日志但不抛出异常

#### resolveEntry
- **签名**：`(id: string) => void`
- **说明**：标记情绪记录为已解决
- **参数**：
  - `id`：记录唯一标识符
- **行为**：
  1. 查找对应的记录
  2. 更新 `status` 为 `Status.RESOLVED`
  3. 设置 `resolvedAt` 为当前时间戳
  4. 更新 `entries` 数组
  5. 保存到本地（防抖 500ms）
  6. 重新计算天气状态
- **副作用**：更新 `entries`、触发 `_saveEntries`、触发 `_calculateWeather`

#### burnEntry
- **签名**：`(id: string) => void`
- **说明**：焚烧动画完成后将条目标为 `Status.BURNED` 并写入 `burnedAt`；**不**从 `entries` 移除
- **副作用**：更新 `entries`、触发 `_saveEntries`、触发 `_calculateWeather`

#### deleteEntry
- **签名**：`(id: string) => Promise<void>`
- **说明**：**软删除**——为匹配 `id` 的条目设置 `deletedAt`（毫秒时间戳），**不**从 `entries` 数组中 `filter` 移除
- **参数**：
  - `id`：记录唯一标识符
- **行为**：
  1. 将对应条目的 `deletedAt` 设为当前时间
  2. 更新 `entries` 数组（条目仍在数组中）
  3. 若 `excludeSoftDeletedEntries` 后无可见条目且存在 `clearFirstEntryDate`，则清空「首条记录日期」
  4. 保存到本地（防抖 500ms）
  5. 重新计算天气状态
- **副作用**：更新 `entries`、触发 `_saveEntries`、触发 `_calculateWeather`
- **注意**：**不**写入 `entry_tombstones`（墓碑仅用于永久从云端删除等路径）。下次 `syncToCloud` 会把 `deletedat` 一并 upsert 到 Supabase；`syncFromCloud` / `recoverFromCloud` 对同 `id` **以云端行为准**，故云端无 `deletedat` 时可覆盖本地软删状态（「找回回忆」语义）

### 用户操作

#### register
- **签名**：`(email: string, password: string, name: string) => Promise<boolean>`
- **说明**：用户注册
- **参数**：
  - `email`：邮箱地址
  - `password`：密码
  - `name`：用户名
- **返回值**：`Promise<boolean>` - 注册是否成功
- **行为**：
  1. 调用 Supabase Auth 注册用户
  2. 将用户名存储到用户元数据
  3. 注册成功后自动登录
  4. 登录成功后加载用户数据
- **错误处理**：
  - 如果用户已注册，抛出异常（由调用方处理）
  - 其他错误返回 `false`
- **副作用**：更新 `user`、触发 `_loadUser`、触发 `_loadEntries`

#### login
- **签名**：`(email: string, password: string) => Promise<boolean>`
- **说明**：用户登录
- **参数**：
  - `email`：邮箱地址
  - `password`：密码
- **返回值**：`Promise<boolean>` - 登录是否成功
- **行为**：
  1. 验证邮箱和密码非空
  2. 调用 Supabase Auth 登录
  3. 从用户元数据或 profiles 表获取用户信息
  4. 更新 `user` 状态
  5. 迁移游客数据到用户存储（如果存在）
  6. 加载用户数据
- **错误处理**：
  - 验证失败返回 `false`
  - 登录失败返回 `false`
- **副作用**：更新 `user`、触发 `_loadUser`、触发 `_loadEntries`

#### logout
- **签名**：`() => Promise<void>`
- **说明**：用户登出
- **行为**：
  1. 保存当前数据到用户专属存储
  2. 将用户数据合并到游客存储（确保退出后仍能看到数据）
  3. 从 Supabase 登出
  4. 清除 `user` 状态（设为 `null`）
  5. 加载游客数据
- **副作用**：更新 `user`、触发 `_loadEntries`

#### updateUser
- **签名**：`(updates: Partial<User>) => Promise<void>`
- **说明**：更新用户信息
- **参数**：
  - `updates`：要更新的用户字段（部分更新）
- **行为**：
  1. 合并更新数据到当前用户信息
  2. 更新 Supabase profiles 表（如果配置）
  3. 更新 `user` 状态
- **错误处理**：如果更新失败，记录错误但不抛出异常

### 数据同步操作

#### syncToCloud
- **签名**：`() => Promise<boolean>`
- **说明**：将本地 `entries` 同步到 Supabase `entries` 表（upsert，`onConflict: id`）
- **返回值**：`Promise<boolean>` - 同步是否成功
- **前置条件**：用户必须已登录
- **行为**：
  1. 检查用户登录状态
  2. 检查是否正在同步（防止竞态条件）
  3. 读取 `entry_tombstones`，从待同步列表中排除墓碑命中的 `id`；若有墓碑 id，先尝试从云端 `entries` 删除对应行（防「复活」）
  4. 将本地每条映射为云端 snake_case 负载（含 `moodlevel`、`resolvedat`、`burnedat`、`deletedat`、`audios` 等）
  5. `upsert`；若遇 RLS `42501` 则回退为逐条 `insert` / `update`
- **错误处理**：
  - 用户未登录返回 `false`
  - 同步进行中返回 `false`
  - 其他错误返回 `false`
- **并发控制**：使用 `isSyncingRef` 互斥锁防止并发同步

#### syncFromCloud
- **签名**：`() => Promise<boolean>`
- **说明**：从 Supabase 拉取 `entries` 并与本地合并后写回本地存储
- **返回值**：`Promise<boolean>` - 同步是否成功
- **前置条件**：用户必须已登录
- **行为**：
  1. 检查用户登录状态
  2. 检查是否正在同步（防止竞态条件）
  3. 拉取 `entry_tombstones`，本地与云端行均过滤墓碑 id
  4. 将云端行映射为 `MoodEntry`（`deletedat` / `deletedAt` → `deletedAt` 毫秒）
  5. **合并**：`Map` 先放入本地（墓碑已剔除），再按云端顺序 `set(cloudEntry.id, cloudEntry)` — **同 id 以云端行为准**（找回回忆依赖此规则）
  6. 按 `timestamp` 降序排序，更新 `entries` 与 AsyncStorage，重算天气，并 `_syncFirstEntryDateFromCloud`
- **错误处理**：
  - 用户未登录返回 `false`
  - 同步进行中返回 `false`
  - 其他错误返回 `false`
- **并发控制**：使用 `isSyncingRef` 互斥锁防止并发同步

#### recoverFromCloud
- **签名**：`() => Promise<boolean>`
- **说明**：与 `syncFromCloud` **相同实现**（内部直接 `return get().syncFromCloud()`）
- **返回值**：`Promise<boolean>` - 恢复是否成功
- **前置条件**：用户必须已登录
- **语义**：按上节合并规则拉云；**不是**整表无条件覆盖本地独有 id（本地独有 id 会先保留进 Map，再被同 id 云端行覆盖）
- **使用场景**：用户主动「从云端恢复 / 找回回忆」

### AI 相关方法

#### generateForecast
- **签名**：`(days?: number) => Promise<void>`
- **说明**：生成情绪预测
- **参数**：
  - `days`：预测天数（默认 7 天）
- **行为**：
  1. 检查 `entries.length < 3`（**当前实现**：`entries` 数组总长度，**含**已软删条目；不足则置 `emotionForecast` 为 `null` 并返回）
  2. 调用 AI 服务生成预测（`utils/aiService.ts` 内会对入参做 `excludeSoftDeletedEntries`）
  3. 更新 `emotionForecast` 状态
- **错误处理**：如果生成失败，将 `emotionForecast` 设为 `null`

#### generatePodcast
- **签名**：`(period?: 'week' | 'month') => Promise<void>`
- **说明**：生成情绪播客
- **参数**：
  - `period`：时间周期（默认 'week'）
- **行为**：
  1. 调用 AI 服务生成播客内容
  2. 更新 `emotionPodcast` 状态
- **错误处理**：如果生成失败，将 `emotionPodcast` 设为 `null`

#### clearForecast
- **签名**：`() => void`
- **说明**：清除情绪预测
- **行为**：将 `emotionForecast` 设为 `null`

#### clearPodcast
- **签名**：`() => void`
- **说明**：清除情绪播客
- **行为**：将 `emotionPodcast` 设为 `null`

## 内部方法规范

### _setEntries
- **签名**：`(entries: MoodEntry[]) => void`
- **说明**：直接设置 `entries` 状态（内部使用）
- **用途**：批量更新记录数组

### _setUser
- **签名**：`(user: User | null) => void`
- **说明**：直接设置 `user` 状态（内部使用）
- **用途**：更新用户信息

### _setWeather
- **签名**：`(weather: WeatherState) => void`
- **说明**：直接设置 `weather` 状态（内部使用）
- **用途**：更新天气状态

### _loadEntries
- **签名**：`() => Promise<void>`
- **说明**：从本地存储加载情绪记录
- **行为**：
  1. 根据当前用户状态选择存储键（用户隔离策略）
  2. 检查并迁移旧版本数据（如果需要）
  3. 从 AsyncStorage 加载数据
  4. 更新 `entries` 状态
  5. 重新计算天气状态

### _loadUser
- **签名**：`() => Promise<void>`
- **说明**：从 Supabase 加载用户信息
- **行为**：
  1. 获取当前会话
  2. 从用户元数据或 profiles 表获取用户信息
  3. 更新 `user` 状态

### _calculateWeather
- **签名**：`() => void`
- **说明**：计算情绪天气状态
- **算法**：
  1. 筛选活跃的情绪记录（`status === 'active'`）
  2. 计算情绪指数：`score = sum(moodLevel * 2)`
  3. 根据阈值确定天气状况：
     - `sunny`：score ≤ 10
     - `cloudy`：10 < score ≤ 20
     - `rainy`：20 < score ≤ 30
     - `stormy`：score > 30
  4. 生成描述文本
  5. 更新 `weather` 状态

### _saveEntries
- **签名**：`() => void`
- **说明**：保存情绪记录到本地存储（带防抖）
- **行为**：
  1. 清除之前的定时器
  2. 设置新的定时器（500ms 后执行）
  3. 根据当前用户状态选择存储键
  4. 保存到 AsyncStorage
- **防抖机制**：使用 `setTimeout` 实现 500ms 防抖，避免频繁写入

## 数据存储策略

### 用户隔离策略

- **登录用户**：使用 `mood_entries_${userId}` 作为存储键
- **游客用户**：使用 `mood_entries_guest` 作为存储键
- **目的**：确保不同用户的数据相互隔离

### 数据迁移策略

- **旧版本迁移**：从 `mood_entries` 迁移到用户专属存储键
- **游客到用户**：登录时将游客数据迁移到用户存储
- **用户到游客**：登出时将用户数据合并到游客存储

### 数据同步策略

- **离线优先**：所有数据首先存储在本地
- **可选同步**：云端同步为可选功能，需要用户登录
- **冲突解决**：
  - `syncToCloud`：将当前本地 `entries`（墓碑 id 除外）**upsert** 到云端；同 `id` 以本次上传负载为准（无 OT/版本向量）
  - `syncFromCloud` / `recoverFromCloud`：**合并**后写回本地 — 先铺本地独有 id，再对同 id **以云端行为准**（见上文「数据同步操作」）

## 性能优化

### 防抖机制
- **目的**：避免频繁写入 AsyncStorage
- **实现**：`_saveEntries` 使用 500ms 防抖
- **触发时机**：每次更新 `entries` 后

### 并发控制
- **目的**：防止数据同步时的竞态条件
- **实现**：使用 `isSyncingRef` 互斥锁
- **应用场景**：`syncToCloud`、`syncFromCloud`

### 批量操作
- **目的**：减少状态更新次数
- **实现**：批量更新 `entries` 数组，然后一次性保存
- **应用场景**：数据同步、数据迁移

## 使用示例

### 基本用法

```typescript
import { useAppStore } from '../store/useAppStore';

// 在组件中使用
const Dashboard = () => {
  const entries = useAppStore((state) => state.entries);
  const weather = useAppStore((state) => state.weather);
  const addEntry = useAppStore((state) => state.addEntry);
  const deleteEntry = useAppStore((state) => state.deleteEntry);
  
  // 添加记录
  const handleAdd = () => {
    void addEntry({
      moodLevel: MoodLevel.ANGRY,
      content: '今天工作很累',
      deadline: 'today',
      people: ['工作'],
      triggers: ['压力'],
    });
  };
  
  // 删除记录
  const handleDelete = (id: string) => {
    void deleteEntry(id);
  };
  
  return (
    // ...
  );
};
```

### 选择器优化

```typescript
// 使用选择器避免不必要的重渲染
const entries = useAppStore((state) => state.entries);
const addEntry = useAppStore((state) => state.addEntry);

// 或者使用 shallow 比较
import { shallow } from 'zustand/shallow';

const { entries, weather } = useAppStore(
  (state) => ({ entries: state.entries, weather: state.weather }),
  shallow
);
```

