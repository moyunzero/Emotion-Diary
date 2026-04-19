# 语音记录功能 - 开发任务列表

## 概述

本任务列表基于 `.monkeycode/specs/voice-recording/design.md` 设计文档拆解。

## 开发阶段

---

### Phase 1: 基础设施

#### 1.1 扩展类型定义

- [ ] 1.1.1 在 `types.ts` 中添加 `AudioData` 接口
  - id, localUri, remoteUrl, duration, fileSize, fileHash, name, createdAt, syncStatus

- [ ] 1.1.2 在 `MoodEntry` 中添加 `audios?: AudioData[]` 字段

- [ ] 1.1.3 添加 `SyncStatus` 类型别名

#### 1.2 创建音频状态管理

- [ ] 1.2.1 创建 `store/modules/audio.ts`
  - AudioState 接口（播放状态、录音状态）
  - AudioActions 接口（播放控制、录音控制）
  - useAudioStore 实现

- [ ] 1.2.2 实现 `computeEntrySyncStatus` 辅助函数

- [ ] 1.2.3 在 `store/modules/types.ts` 中扩展 AppState

---

### Phase 2: 核心组件

#### 2.1 RecordButton 组件

- [ ] 2.1.1 创建 `components/AudioRecorder/RecordButton.tsx`
  - 按住/滑动/释放手势检测
  - 300ms 误触保护
  - 向上滑动取消检测（>30px）
  - 震动反馈

- [ ] 2.1.2 实现不同状态下的 UI 显示
  - idle: "按住说话"
  - recording: "松开结束"
  - canceling: "松开取消"

#### 2.2 WaveformView 组件

- [ ] 2.2.1 创建 `components/AudioRecorder/WaveformView.tsx`
  - 实时音量可视化
  - 性能降级方案（低端设备用 simple-bars）

#### 2.3 AudioPreview 组件

- [ ] 2.3.1 创建 `components/AudioRecorder/AudioPreview.tsx`
  - 播放/暂停控制
  - 时长显示
  - 删除按钮
  - 重命名功能

#### 2.4 AudioList 组件

- [ ] 2.4.1 创建 `components/AudioRecorder/AudioList.tsx`
  - 语音条目列表
  - 播放状态管理
  - 同时只播一个音频

#### 2.5 AudioRecorder 主组件

- [ ] 2.5.1 创建 `components/AudioRecorder/AudioRecorder.tsx`
  - 录音状态机管理
  - 权限请求处理
  - expo-av 录音集成

- [ ] 2.5.2 创建 `components/AudioRecorder/index.ts` 导出

---

### Phase 3: 集成功能

#### 3.1 集成到记录页

- [ ] 3.1.1 在 `components/Record.tsx` 中集成 AudioRecorder
  - 添加附件区域
  - 录音后显示语音列表
  - 保存 Entry 时包含 audios 数据

- [ ] 3.1.2 扩展保存逻辑支持音频

#### 3.2 集成到 EntryCard

- [ ] 3.2.1 扩展 `components/EntryCard.tsx`
  - 显示音频数量图标
  - 点击展开播放控件
  - 播放时显示进度和暂停

#### 3.3 集成到 Dashboard

- [ ] 3.3.1 在 Dashboard 中支持显示音频图标

---

### Phase 4: 存储与同步

#### 4.1 本地存储

- [ ] 4.1.1 实现音频文件存储
  - 存储路径: `FileSystem.documentDirectory/audios/{audioId}.m4a`
  - 音频格式: m4a (AAC)

- [ ] 4.1.2 实现 fileHash 计算（MD5）

- [ ] 4.1.3 实现删除 Entry 时的音频文件级联删除

#### 4.2 云端同步

- [ ] 4.2.1 实现上传流程
  - 检查 pending 状态
  - 上传到 Supabase Storage
  - 更新 syncStatus

- [ ] 4.2.2 实现下载流程
  - 下载远程音频到本地
  - 更新 localUri

- [ ] 4.2.3 扩展 syncFromCloud/syncToCloud 支持音频

---

### Phase 5: 错误处理与优化

#### 5.1 权限处理

- [ ] 5.1.1 麦克风权限请求
- [ ] 5.1.2 权限拒绝引导弹窗

#### 5.2 错误处理

- [ ] 5.2.1 录音启动失败提示
- [ ] 5.2.2 文件保存失败处理
- [ ] 5.2.3 上传失败重试（最多3次）
- [ ] 5.2.4 播放失败降级（remoteUrl 在线播放）

#### 5.3 体验优化

- [ ] 5.3.1 录音草稿保存与恢复
- [ ] 5.3.2 低性能设备波形降级

---

### Phase 6: 测试

#### 6.1 单元测试

- [ ] 6.1.1 AudioData 类型测试
- [ ] 6.1.2 computeEntrySyncStatus 函数测试
- [ ] 6.1.3 录音状态机测试
- [ ] 6.1.4 播放控制测试

#### 6.2 集成测试

- [ ] 6.2.1 Record 页面录音流程测试
- [ ] 6.2.2 Entry 保存与加载测试（含音频）
- [ ] 6.2.3 同步测试（离线上传、下载）

---

## 任务依赖关系

```
Phase 1 (基础设施)
    ↓
Phase 2 (核心组件)
    ↓
Phase 3 (集成功能)
    ↓
Phase 4 (存储与同步)
    ↓
Phase 5 (错误处理) + Phase 6 (测试)
```

## 当前状态

下一任务: **1.1.1 扩展 types.ts，添加 AudioData 接口**
