# 需求文档：编辑条目语音支持

## 引言

为情绪日记应用的编辑功能添加语音支持，使用户能够在编辑已有条目时：
1. 播放、重新录制或删除已有的语音附件
2. 新增语音附件

## 词汇表

- **EditEntryModal**: 编辑条目的模态框组件
- **EditEntryForm**: 编辑表单逻辑层组件
- **AudioRecorder**: 录音机主组件
- **AudioList**: 语音列表组件
- **AudioPreview**: 语音预览组件
- **AudioData**: 语音数据结构

## 需求

### 需求1：编辑时显示已有语音

**用户故事：** 作为用户，我希望在编辑情绪条目时能够看到并管理已有的语音附件，以便我可以选择保留、重新录制或删除它们。

#### Acceptance Criteria

1. WHEN 用户打开已有语音的条目进行编辑，THEN 系统 SHALL 在表单底部显示已有语音列表
2. WHEN 显示已有语音时，THEN 系统 SHALL 为每个语音显示：名称、时长、播放/重新录制/删除按钮
3. WHEN 用户点击播放按钮时，THEN 系统 SHALL 播放对应的语音
4. WHEN 用户点击删除按钮时，THEN 系统 SHALL 从条目中移除该语音
5. WHEN 用户点击重新录制按钮时，THEN 系统 SHALL 触发新的录音流程替换原有语音

### 需求2：编辑时新增语音

**用户故事：** 作为用户，我希望在编辑条目时能够新增语音附件，以便补充更多情绪细节。

#### Acceptance Criteria

1. WHEN 用户在编辑界面，THEN 系统 SHALL 显示录音按钮
2. WHEN 用户点击录音按钮并完成录音，THEN 系统 SHALL 将新语音添加到条目的语音列表
3. WHEN 用户完成表单编辑并保存，THEN 系统 SHALL 保留所有语音附件

### 需求3：编辑表单状态同步

**用户故事：** 作为用户，我希望编辑表单中的语音状态与实际数据保持同步，以便我的操作结果准确反映。

#### Acceptance Criteria

1. WHEN 用户添加新语音时，THEN 系统 SHALL 更新表单状态中的语音列表
2. WHEN 用户删除语音时，THEN 系统 SHALL 从表单状态中移除对应语音
3. WHEN 用户保存表单时，THEN 系统 SHALL 将语音列表随其他字段一起提交
4. WHEN 用户取消编辑时，THEN 系统 SHALL 保留原有的语音数据（不丢失）

## 技术约束

- 使用现有的 `expo-audio` API（createAudioPlayer, useAudioRecorder）
- 复用现有的 AudioRecorder、AudioList、AudioPreview 组件
- 保持与现有代码风格一致
- 编辑表单需要初始化音频状态（audios, currentPlayingId, isPlaying, playbackPosition）
