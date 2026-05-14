# UI 组件规范

> **工程栈、目录、壳层/安全区与风险**：不在本文件重复；见 [`engineering-system.md`](./engineering-system.md)、[`engineering-quality.md`](./engineering-quality.md)（布局见后者 §3）。

本文档定义了情绪日记应用中的所有 UI 组件规范。

## 组件架构

### 组件层次结构

```
app/                        # 页面组件（Expo Router）
├── (tabs)/
│   ├── index.tsx          # Dashboard 页面
│   ├── record.tsx         # Record 页面
│   └── insights.tsx       # Insights 页面
└── profile.tsx            # Profile 页面

components/                 # 可复用组件
├── Dashboard.tsx          # 主页面组件
├── Record.tsx             # 记录页面组件
├── Insights.tsx           # 洞察页面组件
├── WeatherStation.tsx     # 情绪气象站组件
├── EntryCard.tsx          # 情绪记录卡片组件
├── EditEntryModal.tsx     # 编辑记录模态框组件
├── Toast.tsx              # Toast 提示组件
├── AddTagInput.tsx        # 标签输入组件
└── ai/
    └── EmotionPodcast.tsx # AI 情绪播客组件
```

## 页面组件

### Dashboard（主页面）

**文件路径**：`components/Dashboard.tsx`

**功能说明**：
- 显示情绪记录列表
- 显示情绪气象站
- 提供记录筛选功能
- 支持删除记录（气话焚烧）

**Props**：
- 无（使用 Zustand Store 获取状态）

**状态管理**：
- `entries`：从 `useAppStore` 获取所有记录
- `weather`：从 `useAppStore` 获取天气状态
- `user`：从 `useAppStore` 获取用户信息
- `deleteEntry`：从 `useAppStore` 获取删除方法

**本地状态**：
- `filter`：筛选类型（'all' | 'active' | 'resolved'）
- `avatarError`：头像加载错误状态
- `isFilterOpen`：筛选菜单是否打开
- `filterButtonLayout`：筛选按钮布局信息

**主要功能**：

1. **记录列表展示**：
   - 使用 `FlatList` 渲染记录列表
   - 支持筛选（全部/未处理/已和解）
   - 按时间倒序排列
   - 使用 `EntryCard` 组件渲染每个记录

2. **筛选功能**：
   - 支持三种筛选模式：全部、未处理、已和解
   - 筛选偏好保存到 AsyncStorage
   - 筛选菜单动态定位

3. **情绪气象站**：
   - 使用 `WeatherStation` 组件显示
   - 显示当前关系天气和情绪指数

4. **删除功能**：
   - 支持通过气话焚烧功能删除记录
   - 删除操作立即生效并保存

**交互逻辑**：
- 点击筛选按钮：打开/关闭筛选菜单
- 选择筛选选项：更新筛选状态并保存偏好
- 点击记录卡片：跳转到详情（如需要）
- 气话焚烧：删除记录并触发动画

### Record（记录页面）

**文件路径**：`components/Record.tsx`

**功能说明**：
- 创建新的情绪记录
- 编辑情绪内容
- 选择情绪等级
- 设置处理期限
- 添加人物和触发器标签
- 自动保存草稿

**Props**：
```typescript
interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}
```

**状态管理**：
- `addEntry`：从 `useAppStore` 获取添加方法

**本地状态**：
- `moodLevel`：情绪等级
- `content`：情绪内容
- `deadline`：处理期限
- `isCustomDeadline`：是否使用自定义期限
- `customDeadlineText`：自定义期限文本
- `selectedPeople`：选中的人物标签
- `selectedTriggers`：选中的触发器标签
- `customPeopleOptions`：自定义人物选项
- `customTriggerOptions`：自定义触发器选项
- `moodTipVisible`：情绪提示 Modal 是否显示
- `selectedMoodTip`：选中的情绪提示

**主要功能**：

1. **情绪等级选择**：
   - 5级情绪等级（从"有点委屈"到"情绪爆发"）
   - 使用天气主题图标
   - 点击显示情绪描述提示

2. **内容输入**：
   - 多行文本输入
   - 自动保存草稿（防抖 1秒）
   - 支持自动加载草稿

3. **期限设置**：
   - 预设选项：今天谈、本周内、本月内、以后说、自己消化
   - 支持自定义期限文本
   - 切换预设和自定义模式

4. **标签系统**：
   - 人物标签：支持预设选项和自定义标签
   - 触发器标签：支持预设选项和自定义标签
   - 使用 `AddTagInput` 组件管理标签

5. **草稿管理**：
   - 自动保存草稿（防抖 1秒）
   - 支持加载草稿
   - 提交后清除草稿

**交互逻辑**：
- 选择情绪等级：更新等级并显示提示
- 输入内容：自动保存草稿
- 选择标签：添加到选中列表
- 添加自定义标签：保存到 AsyncStorage
- 提交表单：创建记录并清除草稿

### Insights（洞察页面）

**文件路径**：`components/Insights.tsx`

**功能说明**：
- 显示本周情绪天气
- 显示治愈进度（情绪解决率）
- 显示关系花盆（关系健康度）
- 显示情绪触发洞察
- 显示 AI 情绪播客

**Props**：
- 无（使用 Zustand Store 获取状态）

**状态管理**：
- `entries`：从 `useAppStore` 获取所有记录
- `generatePodcast`：从 `useAppStore` 获取生成播客方法

**主要功能**：

1. **本周情绪天气**：
   - 显示最近7天的情绪状态
   - 每天显示天气图标和花朵状态
   - 使用不同的花朵状态表示情绪等级

2. **治愈进度**：
   - 环形进度条显示情绪解决率
   - 从种子到开花的成长阶段
   - 显示具体百分比

3. **关系花盆**：
   - 每个人对应一个花盆
   - 显示关系健康度（繁花盛开/正常生长/需要浇水）
   - 基于该人物的情绪记录计算

4. **情绪触发洞察**：
   - 分析 Top 3 情绪触发器
   - 显示触发频率和平均情绪等级
   - 配合温暖的"园艺建议"

5. **AI 情绪播客**：
   - 使用 `EmotionPodcast` 组件显示
   - 支持生成本周或本月的播客

**交互逻辑**：
- 点击情绪触发洞察：显示 AI 情绪处方
- 生成播客：调用 AI 服务生成内容
- 查看详情：跳转到相关记录（如需要）

## 功能组件

### WeatherStation（情绪气象站）

**文件路径**：`components/WeatherStation.tsx`

**功能说明**：
- 显示当前关系天气状态
- 显示情绪指数
- 显示情绪预测
- 支持生成情绪预测

**Props**：
- 无（使用 Zustand Store 获取状态）

**状态管理**：
- `weather`：从 `useAppStore` 获取天气状态
- `emotionForecast`：从 `useAppStore` 获取预测数据
- `entries`：从 `useAppStore` 获取所有记录
- `generateForecast`：从 `useAppStore` 获取生成预测方法

**本地状态**：
- `isForecastExpanded`：预测是否展开
- `isGenerating`：是否正在生成预测

**主要功能**：

1. **天气显示**：
   - 根据 `weather.condition` 显示对应图标
   - 显示情绪指数（score）
   - 显示天气描述

2. **情绪预测**：
   - 可展开/折叠预测内容
   - 显示未来7天的情绪预测
   - 显示预测摘要和警告

3. **生成预测**：
   - 点击按钮生成预测
   - 显示加载状态
   - 调用 AI 服务生成

**交互逻辑**：
- 点击预测标题：展开/折叠预测内容
- 点击生成按钮：调用 AI 服务生成预测
- 显示加载状态：生成过程中显示加载指示器

### EntryCard（情绪记录卡片）

**文件路径**：`components/EntryCard.tsx`

**功能说明**：
- 显示情绪记录信息
- 支持编辑记录
- 支持删除记录（气话焚烧）
- 支持标记为已解决

**Props**：
```typescript
interface Props {
  entry: MoodEntry;
  onBurn?: (id: string, text: string) => void;
}
```

**状态管理**：
- `updateEntry`：从 `useAppStore` 获取更新方法
- `resolveEntry`：从 `useAppStore` 获取解决方法

**本地状态**：
- `isEditing`：是否正在编辑
- `isBurning`：是否正在焚烧
- `showEditModal`：是否显示编辑模态框

**主要功能**：

1. **记录信息显示**：
   - 情绪等级图标和标签
   - 情绪内容文本
   - 处理期限标签
   - 人物和触发器标签
   - 创建时间

2. **编辑功能**：
   - 点击编辑按钮打开编辑模态框
   - 使用 `EditEntryModal` 组件编辑
   - 支持更新所有字段

3. **删除功能（气话焚烧）**：
   - 使用 Skia 渲染燃烧动画
   - 动画完成后删除记录
   - 提供视觉反馈

4. **解决功能**：
   - 点击解决按钮标记为已解决
   - 更新状态和解决时间

**交互逻辑**：
- 点击编辑按钮：打开编辑模态框
- 点击删除按钮：触发焚烧动画
- 点击解决按钮：标记为已解决
- 焚烧动画：动画完成后删除记录

### EditEntryModal（编辑记录模态框）

**文件路径**：`components/EditEntryModal.tsx`

**功能说明**：
- 编辑现有情绪记录
- 支持修改所有字段
- 保存编辑历史

**Props**：
```typescript
interface Props {
  entry: MoodEntry;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<MoodEntry>) => void;
}
```

**状态管理**：
- 无（通过 Props 传递数据和方法）

**本地状态**：
- 表单字段状态（与 Record 组件类似）

**主要功能**：
- 与 Record 组件类似，但用于编辑现有记录
- 支持修改所有字段
- 保存时会创建编辑历史记录

### Toast（Toast 提示）

**文件路径**：`components/Toast.tsx`

**功能说明**：
- 显示提示消息
- 支持成功、错误、警告等类型
- 自动消失

**Props**：
```typescript
interface Props {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  visible: boolean;
  onHide: () => void;
}
```

### AddTagInput（标签输入）

**文件路径**：`components/AddTagInput.tsx`

**功能说明**：
- 输入和选择标签
- 支持预设选项和自定义标签
- 显示选中标签

**Props**：
```typescript
interface Props {
  label: string;
  options: string[];
  selected: string[];
  onSelect: (tag: string) => void;
  onRemove: (tag: string) => void;
  onAddCustom: (tag: string) => void;
  customOptions: string[];
  onRemoveCustom: (tag: string) => void;
}
```

### EmotionPodcast（AI 情绪播客）

**文件路径**：`components/ai/EmotionPodcast.tsx`

**功能说明**：
- 显示 AI 生成的情绪播客内容
- 支持生成本周或本月的播客
- 显示加载状态

**Props**：
- 无（使用 Zustand Store 获取状态）

**状态管理**：
- `emotionPodcast`：从 `useAppStore` 获取播客数据
- `generatePodcast`：从 `useAppStore` 获取生成方法

## 设计规范

### 配色方案

- **主色调**：粉绿渐变（`#FDA4AF` → `#86EFAC`）
- **背景色**：浅粉绿渐变（`#FFF5F5` → `#F0FDF4`）
- **文字色**：深灰（`#1F2937`）、中灰（`#6B7280`）
- **卡片背景**：白色（`#FFFFFF`）

### 图标系统

- **图标库**：Lucide React Native
- **情绪图标**：
  - `Droplet`：有点委屈（1级）
  - `Cloud`：心情低落（2级）
  - `CloudRain`：感到生气（3级）
  - `CloudLightning`：非常愤怒（4级）
  - `Zap`：情绪爆发（5级）

### 动画规范

- **动画库**：React Native Reanimated
- **动画类型**：
  - 过渡动画：300ms
  - 交互动画：150ms
  - 加载动画：循环
  - 焚烧动画：Skia 渲染

### 响应式设计

- **屏幕适配**：使用 `Dimensions` API 获取屏幕尺寸
- **安全区域**：使用 `SafeAreaView` 处理刘海屏
- **键盘处理**：使用 `KeyboardAvoidingView` 处理键盘遮挡

## 性能优化

### 列表优化

- 使用 `FlatList` 进行虚拟滚动
- 使用 `keyExtractor` 优化 key 提取
- 使用 `useCallback` 优化渲染函数
- 使用 `getItemLayout` 优化滚动性能（如适用）

### 状态优化

- 使用 Zustand 选择器避免不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 缓存回调函数

### 防抖和节流

- 草稿保存：1秒防抖
- 数据保存：500ms 防抖
- 搜索输入：300ms 防抖

## 可访问性

### 无障碍功能

- 使用 `accessibilityLabel` 提供标签
- 使用 `accessibilityHint` 提供提示
- 使用 `accessibilityRole` 提供角色
- 支持屏幕阅读器

### 键盘导航

- 支持 Tab 键导航
- 支持回车键提交
- 支持 Esc 键关闭

