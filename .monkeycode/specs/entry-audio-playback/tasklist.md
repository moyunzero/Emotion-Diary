# 需求实施计划 - EntryCard 语音播放功能

## 概述

在 EntryCard 展开状态下，为语音附件添加播放功能。

## 任务列表

- [ ] 1. 在 EntryCard.styles.ts 中新增播放区样式
  - 添加 `audioPlaySection` - 播放区容器样式
  - 添加 `audioPlaySectionTitle` - 区域标题样式
  - 添加 `audioPlayItem` - 播放项行样式
  - 添加 `audioPlayItemActive` - 正在播放项的高亮背景样式
  - 添加 `audioPlayName` - 录音名称文本样式
  - 添加 `audioPlayNameActive` - 播放中名称样式
  - 添加 `audioPlayDuration` - 播放时长文本样式

- [ ] 2. 在 EntryCard.tsx 中导入必要的依赖
  - 从 `expo-av` 导入 `Audio` 和 `AVPlaybackStatus`
  - 从 `lucide-react-native` 导入 `Play` 和 `Pause` 图标
  - 从 `../types` 导入 `AudioData` 类型

- [ ] 3. 在 EntryCard 组件中新增播放状态
  - 添加 `playingAudioId` state - 当前播放的音频ID
  - 添加 `playbackPosition` state - 播放进度（秒）
  - 添加 `audioSoundRef` ref - 引用 Audio.Sound 对象

- [ ] 4. 在 EntryCard 组件中新增辅助函数
  - 添加 `formatDuration` 函数 - 格式化时长显示（如 1:05）
  - 添加 `handlePlayAudio` 函数 - 处理播放/暂停逻辑
  - 实现音频 URL 解析（优先 localUri，回退 remoteUrl）
  - 实现播放状态回调更新 playbackPosition
  - 实现播放完成自动停止逻辑

- [ ] 5. 在 EntryCard 组件中添加 useEffect 清理函数
  - 组件卸载时停止播放并卸载音频资源
  - 防止音频资源泄漏

- [ ] 6. 在 EntryCard 展开状态 UI 中新增语音播放区
  - 在标签区域下方添加播放区
  - 遍历 `entry.audios` 数组渲染播放项
  - 每个播放项显示：图标、名称、播放/暂停按钮
  - 播放中项显示高亮背景和时长
  - 添加无障碍标签

- [ ] 7. TypeScript 类型检查
  - 运行 `yarn typecheck` 确保无类型错误

- [ ] 8. ESLint 代码检查
  - 运行 `yarn lint` 确保无代码规范问题

## 检查点

确保 TypeScript 类型检查和 ESLint 检查通过后，任务完成。

## 验收标准

1. [ ] 展开的 EntryCard 显示语音播放列表
2. [ ] 点击播放按钮可正常播放语音
3. [ ] 播放时显示暂停按钮和播放指示
4. [ ] 播放完成自动停止
5. [ ] 缩略状态保持原样（仅显示标签）
