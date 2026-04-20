# 技术设计文档：编辑条目语音支持

## 概述

本设计文档描述如何在编辑条目模态框中集成语音管理功能。

## 架构设计

### 修改范围

1. **EditEntryForm.tsx** - 添加语音状态管理和 AudioRecorder 集成
2. **EditEntryModal.styles.ts** - 添加语音区域的样式

### 数据流

```
EditEntryForm
├── useState: audios (AudioData[])
├── useState: currentPlayingId (string | null)
├── useState: isPlaying (boolean)
├── useState: playbackPosition (number)
├── useCallback: handlePlayAudio
├── useCallback: handlePauseAudio
├── useCallback: handlePlaybackPositionChange
└── render: AudioRecorder
    └── AudioList
        └── AudioPreview
```

### 组件职责

#### EditEntryForm

- 管理音频相关的所有状态
- 处理音频播放/暂停/位置更新
- 处理表单提交时包含音频数据

#### AudioRecorder

- 复用现有的录音组件
- 管理录制状态和音频列表
- 提供播放、删除、重命名功能

## 界面设计

### 编辑表单底部区域

```
┌─────────────────────────────────────┐
│  语音附件                           │
├─────────────────────────────────────┤
│  [已录制语音1] - ▶ ⏺ 🗑            │
│  [已录制语音2] - ▶ ⏺ 🗑            │
├─────────────────────────────────────┤
│         ⏺ (录音按钮)                │
│        00:00                        │
└─────────────────────────────────────┘
```

## 实现步骤

1. 在 EditEntryForm 中添加音频相关状态
2. 在 useEffect 中初始化音频状态（当 entry.audios 存在时）
3. 在 EditEntryFields 后添加 AudioRecorder 组件
4. 在 handleSubmit 中包含 audios 字段
5. 添加语音区域的样式

## 参考文件

- components/AudioRecorder/AudioRecorder.tsx
- components/AudioRecorder/AudioList.tsx
- components/AudioRecorder/AudioPreview.tsx
- components/EditEntryModal/EditEntryForm.tsx
- types.ts (AudioData, MoodEntry)
