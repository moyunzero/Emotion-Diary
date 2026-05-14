# 工具函数规范

> **工程栈、目录、集成与风险**：不在本文件重复；见 [`engineering-system.md`](./engineering-system.md)、[`engineering-quality.md`](./engineering-quality.md) 文首说明。

本文档定义了情绪日记应用中的所有工具函数规范。

## 日期工具（dateUtils.ts）

**文件路径**：`utils/dateUtils.ts`

### 功能说明

提供日期和时间戳的格式化、转换和处理功能。

### API 方法

#### formatDate

**签名**：
```typescript
export const formatDate = (timestamp: number): string
```

**功能说明**：
- 格式化日期为本地日期字符串（YYYY-MM-DD格式）
- 避免时区问题，使用本地时区的年月日

**参数**：
- `timestamp`：时间戳（毫秒）

**返回值**：
- `string`：格式化的日期字符串，如 "2024-01-15"

**示例**：
```typescript
const dateStr = formatDate(Date.now()); // "2024-01-15"
```

#### formatDateChinese

**签名**：
```typescript
export const formatDateChinese = (timestamp: number): string
```

**功能说明**：
- 格式化日期为中文日期字符串

**参数**：
- `timestamp`：时间戳（毫秒）

**返回值**：
- `string`：格式化的日期字符串，如 "2024年1月15日"

**示例**：
```typescript
const dateStr = formatDateChinese(Date.now()); // "2024年1月15日"
```

#### formatDateShort

**签名**：
```typescript
export const formatDateShort = (timestamp: number): string
```

**功能说明**：
- 格式化日期为简短格式（用于显示）

**参数**：
- `timestamp`：时间戳（毫秒）

**返回值**：
- `string`：格式化的日期字符串，如 "1/15"

**示例**：
```typescript
const dateStr = formatDateShort(Date.now()); // "1/15"
```

#### ensureMilliseconds

**签名**：
```typescript
export const ensureMilliseconds = (timestamp: number): number
```

**功能说明**：
- 确保时间戳为毫秒格式
- 如果数据库返回秒级时间戳，转换为毫秒

**参数**：
- `timestamp`：时间戳（可能是秒或毫秒）

**返回值**：
- `number`：毫秒级时间戳

**算法**：
- 如果时间戳小于 946684800000（2000-01-01 的时间戳），认为是秒级时间戳，乘以 1000
- 否则认为是毫秒级时间戳，直接返回

**示例**：
```typescript
const ms = ensureMilliseconds(1705276800); // 如果是秒级，转换为毫秒
```

## 草稿管理（draftManager.ts）

**文件路径**：`utils/draftManager.ts`

### 功能说明

管理情绪记录的草稿数据，支持保存、加载和清除草稿。

### 数据结构

```typescript
export interface DraftEntry {
  moodLevel: number;
  content: string;
  deadline: string;
  customDeadlineText: string;
  isCustomDeadline: boolean;
  selectedPeople: string[];
  selectedTriggers: string[];
}
```

### 存储键

- `DRAFT_KEY = 'draft_entry'`

### API 方法

#### saveDraft

**签名**：
```typescript
export const saveDraft = async (draft: DraftEntry): Promise<void>
```

**功能说明**：
- 保存草稿到 AsyncStorage

**参数**：
- `draft`：草稿数据

**返回值**：
- `Promise<void>`：保存完成

**错误处理**：
- 如果保存失败，记录错误但不抛出异常

**示例**：
```typescript
await saveDraft({
  moodLevel: 1,
  content: '今天心情不好',
  deadline: 'today',
  customDeadlineText: '',
  isCustomDeadline: false,
  selectedPeople: ['朋友'],
  selectedTriggers: ['工作'],
});
```

#### loadDraft

**签名**：
```typescript
export const loadDraft = async (): Promise<DraftEntry | null>
```

**功能说明**：
- 从 AsyncStorage 加载草稿

**返回值**：
- `Promise<DraftEntry | null>`：草稿数据（如果存在）或 null

**错误处理**：
- 如果加载失败，返回 null 并记录错误

**示例**：
```typescript
const draft = await loadDraft();
if (draft) {
  // 使用草稿数据
}
```

#### clearDraft

**签名**：
```typescript
export const clearDraft = async (): Promise<void>
```

**功能说明**：
- 清除草稿

**返回值**：
- `Promise<void>`：清除完成

**错误处理**：
- 如果清除失败，记录错误但不抛出异常

**示例**：
```typescript
await clearDraft();
```

#### hasDraft

**签名**：
```typescript
export const hasDraft = async (): Promise<boolean>
```

**功能说明**：
- 检查是否有草稿

**返回值**：
- `Promise<boolean>`：是否有草稿

**错误处理**：
- 如果检查失败，返回 false 并记录错误

**示例**：
```typescript
const hasDraftData = await hasDraft();
if (hasDraftData) {
  // 提示用户是否加载草稿
}
```

## 自定义标签管理（customTagsManager.ts）

**文件路径**：`utils/customTagsManager.ts`

### 功能说明

管理用户自定义的人物标签和触发器标签，支持添加、删除和保存标签。

### 存储键

- `CUSTOM_PEOPLE_KEY = 'custom_people'`
- `CUSTOM_TRIGGERS_KEY = 'custom_triggers'`

### API 方法

#### loadCustomOptions

**签名**：
```typescript
export const loadCustomOptions = async (): Promise<{
  people: string[];
  triggers: string[];
}>
```

**功能说明**：
- 加载所有自定义标签

**返回值**：
- `Promise<{ people: string[], triggers: string[] }>`：自定义人物和触发器标签数组

**错误处理**：
- 如果加载失败，返回空数组并记录错误

**示例**：
```typescript
const { people, triggers } = await loadCustomOptions();
```

#### saveCustomPeople

**签名**：
```typescript
export const saveCustomPeople = async (people: string[]): Promise<void>
```

**功能说明**：
- 保存自定义人物标签

**参数**：
- `people`：人物标签数组

**返回值**：
- `Promise<void>`：保存完成

**错误处理**：
- 如果保存失败，抛出异常

**示例**：
```typescript
await saveCustomPeople(['同事', '同学']);
```

#### saveCustomTriggers

**签名**：
```typescript
export const saveCustomTriggers = async (triggers: string[]): Promise<void>
```

**功能说明**：
- 保存自定义触发器标签

**参数**：
- `triggers`：触发器标签数组

**返回值**：
- `Promise<void>`：保存完成

**错误处理**：
- 如果保存失败，抛出异常

**示例**：
```typescript
await saveCustomTriggers(['压力', '焦虑']);
```

#### addCustomPerson

**签名**：
```typescript
export const addCustomPerson = async (
  currentOptions: string[],
  newPerson: string
): Promise<string[]>
```

**功能说明**：
- 添加新的人物标签

**参数**：
- `currentOptions`：当前的人物标签数组
- `newPerson`：新的人物标签

**返回值**：
- `Promise<string[]>`：更新后的人物标签数组

**行为**：
- 去除首尾空格
- 检查是否为空，如果为空返回原数组
- 检查是否重复，如果重复返回原数组
- 添加到数组并保存

**错误处理**：
- 如果添加失败，抛出异常

**示例**：
```typescript
const updated = await addCustomPerson(['朋友'], '同事');
// updated = ['朋友', '同事']
```

#### addCustomTrigger

**签名**：
```typescript
export const addCustomTrigger = async (
  currentOptions: string[],
  newTrigger: string
): Promise<string[]>
```

**功能说明**：
- 添加新的触发器标签

**参数**：
- `currentOptions`：当前的触发器标签数组
- `newTrigger`：新的触发器标签

**返回值**：
- `Promise<string[]>`：更新后的触发器标签数组

**行为**：
- 与 `addCustomPerson` 类似

**错误处理**：
- 如果添加失败，抛出异常

**示例**：
```typescript
const updated = await addCustomTrigger(['工作'], '压力');
// updated = ['工作', '压力']
```

#### removeCustomPerson

**签名**：
```typescript
export const removeCustomPerson = async (
  currentOptions: string[],
  personToRemove: string
): Promise<string[]>
```

**功能说明**：
- 删除人物标签

**参数**：
- `currentOptions`：当前的人物标签数组
- `personToRemove`：要删除的人物标签

**返回值**：
- `Promise<string[]>`：更新后的人物标签数组

**行为**：
- 过滤掉要删除的标签
- 保存更新后的数组

**错误处理**：
- 如果删除失败，抛出异常

**示例**：
```typescript
const updated = await removeCustomPerson(['朋友', '同事'], '同事');
// updated = ['朋友']
```

#### removeCustomTrigger

**签名**：
```typescript
export const removeCustomTrigger = async (
  currentOptions: string[],
  triggerToRemove: string
): Promise<string[]>
```

**功能说明**：
- 删除触发器标签

**参数**：
- `currentOptions`：当前的触发器标签数组
- `triggerToRemove`：要删除的触发器标签

**返回值**：
- `Promise<string[]>`：更新后的触发器标签数组

**行为**：
- 与 `removeCustomPerson` 类似

**错误处理**：
- 如果删除失败，抛出异常

**示例**：
```typescript
const updated = await removeCustomTrigger(['工作', '压力'], '压力');
// updated = ['工作']
```

## 情绪图标工具（moodIconUtils.tsx）

**文件路径**：`utils/moodIconUtils.tsx`

### 功能说明

根据图标名称返回对应的情绪图标组件。

### API 方法

#### getMoodIcon

**签名**：
```typescript
export const getMoodIcon = (
  iconName: string,
  color: string,
  size: number = 20
): React.ReactElement
```

**功能说明**：
- 根据图标名称返回对应的情绪图标组件
- 支持自定义颜色和大小

**参数**：
- `iconName`：图标名称（'Droplet' | 'Cloud' | 'CloudRain' | 'CloudLightning' | 'Zap'）
- `color`：图标颜色（CSS 颜色值）
- `size`：图标大小（默认 20）

**返回值**：
- `React.ReactElement`：React 图标组件

**图标映射**：
- `'Droplet'` → `<Droplet />`（有点委屈）
- `'Cloud'` → `<Cloud />`（心情低落）
- `'CloudRain'` → `<CloudRain />`（感到生气）
- `'CloudLightning'` → `<CloudLightning />`（非常愤怒）
- `'Zap'` → `<Zap />`（情绪爆发）
- 默认 → `<Droplet />`

**示例**：
```typescript
const icon = getMoodIcon('Droplet', '#F59E0B', 24);
```

## 使用示例

### 日期工具使用

```typescript
import { formatDate, formatDateChinese, formatDateShort, ensureMilliseconds } from '../utils/dateUtils';

// 格式化日期
const dateStr = formatDate(Date.now()); // "2024-01-15"
const chineseDate = formatDateChinese(Date.now()); // "2024年1月15日"
const shortDate = formatDateShort(Date.now()); // "1/15"

// 确保时间戳为毫秒
const ms = ensureMilliseconds(1705276800);
```

### 草稿管理使用

```typescript
import { saveDraft, loadDraft, clearDraft, hasDraft } from '../utils/draftManager';

// 保存草稿
await saveDraft({
  moodLevel: 1,
  content: '今天心情不好',
  deadline: 'today',
  customDeadlineText: '',
  isCustomDeadline: false,
  selectedPeople: ['朋友'],
  selectedTriggers: ['工作'],
});

// 加载草稿
const draft = await loadDraft();

// 清除草稿
await clearDraft();

// 检查是否有草稿
const hasDraftData = await hasDraft();
```

### 自定义标签管理使用

```typescript
import {
  loadCustomOptions,
  addCustomPerson,
  addCustomTrigger,
  removeCustomPerson,
  removeCustomTrigger,
} from '../utils/customTagsManager';

// 加载自定义标签
const { people, triggers } = await loadCustomOptions();

// 添加自定义标签
const updatedPeople = await addCustomPerson(people, '同事');
const updatedTriggers = await addCustomTrigger(triggers, '压力');

// 删除自定义标签
const newPeople = await removeCustomPerson(updatedPeople, '同事');
const newTriggers = await removeCustomTrigger(updatedTriggers, '压力');
```

### 情绪图标工具使用

```typescript
import { getMoodIcon } from '../utils/moodIconUtils';

// 获取图标组件
const icon = getMoodIcon('Droplet', '#F59E0B', 24);

// 在组件中使用
<View>
  {getMoodIcon('Cloud', '#6B7280', 32)}
</View>
```

## 错误处理规范

### 日期工具
- 所有函数都是纯函数，不抛出异常
- 如果输入无效，返回默认值或空字符串

### 草稿管理
- 保存和清除失败时不抛出异常，只记录错误
- 加载失败时返回 null，不抛出异常
- 检查失败时返回 false，不抛出异常

### 自定义标签管理
- 加载失败时返回空数组，不抛出异常
- 保存、添加、删除失败时抛出异常（由调用方处理）

### 情绪图标工具
- 如果图标名称不存在，返回默认图标（Droplet）
- 不抛出异常

## 存储规范

### AsyncStorage 键命名

- 草稿：`draft_entry`
- 自定义人物标签：`custom_people`
- 自定义触发器标签：`custom_triggers`

### 数据格式

- 所有数据都使用 JSON 格式存储
- 使用 `JSON.stringify` 序列化
- 使用 `JSON.parse` 反序列化

## 性能优化

### 缓存策略

- 草稿数据不缓存，每次都从 AsyncStorage 读取
- 自定义标签数据不缓存，每次都从 AsyncStorage 读取

### 防抖策略

- 草稿保存使用防抖（1秒），避免频繁写入
- 自定义标签保存不使用防抖（立即保存）

