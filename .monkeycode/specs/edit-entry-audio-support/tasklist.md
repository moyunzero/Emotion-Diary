# 需求实施计划：编辑条目语音支持

- [ ] 1. 在 EditEntryForm 添加音频状态
  - 添加 useState 管理 audios, currentPlayingId, isPlaying, playbackPosition
  - 参考 AudioRecorder 组件的接口设计

- [ ] 2. 在 useEffect 中初始化音频状态
  - 当 visible && entry 时，从 entry.audios 初始化状态

- [ ] 3. 在 EditEntryForm 中集成 AudioRecorder 组件
  - 在 EditEntryFields 后添加 AudioRecorder
  - 传递所有必要的 props

- [ ] 4. 修改 handleSubmit 包含 audios 字段
  - 将 audios 添加到 updateEntry 调用中

- [ ] 5. 添加语音区域的样式
  - 在 EditEntryModal.styles.ts 中添加 audioSectionTitle 等样式

- [ ]* 6. 编写单元测试
  - [ ]* 6.1 为 EditEntryForm 音频状态管理编写测试
  - [ ]* 6.2 为 handleSubmit 包含 audios 字段编写测试
  - [ ]* 6.3 为音频初始化逻辑编写测试
