# 组件文档

## 概述

组件按功能分为以下几类：

| 目录 | 职责 | 独立性 |
|------|------|--------|
| `components/` | 通用 UI 组件 | 高 |
| `components/AudioRecorder/` | 录音功能 | 中 |
| `components/Insights/` | 洞察展示 | 中 |
| `components/ReviewExport/` | 导出功能 | 低 |
| `features/profile/` | 个人中心 | 低 |

## 通用组件

### EntryCard

情绪条目卡片组件。

**Props**:
```typescript
interface EntryCardProps {
  entry: MoodEntry;
  onBurn?: (id: string) => void;
}
```

**特性**:
- 显示情绪图标、状态、时间
- 支持滑动操作（解决/焚烧）
- 包含音频播放控件
- 使用 `React.memo` 优化

### MoodForm

情绪记录表单。

**状态**:
- moodLevel (必填)
- content (必填)
- deadline (必填)
- people (可选)
- triggers (可选)
- intensity (可选)

### WeatherStation

天气状态展示组件。

**Props**:
```typescript
interface WeatherStationProps {
  compact?: boolean;
}
```

### Dashboard

首页仪表盘。

**包含**:
- WeatherStation
- EntryCard 列表
- FilterBar (筛选)
- FAB (新建条目)

### Record

录音页面。

**包含**:
- AudioRecorder
- MoodForm
- 预览和提交

### Toast

轻量级消息提示。

## AudioRecorder 模块

### AudioRecorder

录音主组件。

**Props**:
```typescript
interface AudioRecorderProps {
  onRecordingComplete?: (audio: AudioData) => void;
  onCancel?: () => void;
}
```

### RecordButton

按住说话按钮。

**Props**:
```typescript
interface RecordButtonProps {
  recordingState: RecordingState;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onRecordingCancel: () => void;
  disabled?: boolean;
}
```

### WaveformView

录音波形可视化。

**Props**:
```typescript
interface WaveformViewProps {
  isActive: boolean;
  level?: number;
}
```

### AudioPreview

音频预览播放器。

**Props**:
```typescript
interface AudioPreviewProps {
  audio: AudioData;
  onDelete?: () => void;
}
```

## Insights 模块

### InsightsScreen

洞察主页面。

### EmotionReleaseArchive

情绪释放归档展示。

### RelationshipGarden

关系花园可视化。

### TriggerInsight

触发因素洞察。

### WeeklyMoodWeather

周度情绪天气。

### HealingProgress

治愈进度展示。

### PrescriptionCard

建议卡片。

## ReviewExport 模块

### ReviewExportScreen

回顾导出页面。

### ReviewExportCanvas

导出画布 (用于生成图片)。

## Profile 模块

### ProfileScreen

个人中心页面。

### ProfileUserCard

用户信息卡片。

### ProfileStatCard

统计信息卡片。

### ProfileMenuItem

菜单项。

## 组件模式

### 命名导出

```typescript
// 推荐
export const MyComponent: React.FC = () => {};

// 不推荐
export default MyComponent;
```

### Props 类型

```typescript
// 文件内定义
interface MyComponentProps {
  title: string;
}

// 或单独导出
export type { MyComponentProps };
```

### Story 模式 (未来计划)

计划使用 Storybook 进行组件开发文档化。

---

*最后更新: 2026-04-20*
