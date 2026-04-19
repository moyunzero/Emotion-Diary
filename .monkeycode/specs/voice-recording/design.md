# 语音记录功能设计方案

## 一、功能概述

### 1.1 功能定位

语音记录是情绪记录的附件方式，用户可选择：
- 纯文字记录
- 纯语音记录
- 文字+语音组合

### 1.2 使用场景

- 情绪激动时来不及打字，直接语音输出
- 打字不方便时（如睡前、驾驶中）
- 语音比文字更能传达情感温度

### 1.3 技术选型

| 依赖 | 用途 |
|------|------|
| expo-av | 录音与播放 |
| expo-media-library | 保存到系统相册（可选） |
| expo-file-system | 本地文件管理 |
| Supabase Storage | 云端音频存储 |

---

## 二、数据模型

### 2.1 核心数据结构

```typescript
// 音频数据结构
interface AudioData {
  id: string;                    // 唯一标识
  localUri: string;             // 本地路径
  remoteUrl?: string;            // 云端URL（同步后填充）
  duration: number;              // 时长（秒）
  fileSize: number;             // 文件大小（字节）
  fileHash: string;             // MD5哈希，用于去重和完整性校验
  name?: string;                // 用户自定义名称
  createdAt: number;            // 创建时间
  syncStatus: SyncStatus;        // 同步状态
}

// Entry 数据结构
interface Entry {
  id: string;
  text?: string;                // 文字描述
  audios?: AudioData[];         // 语音附件（支持多条）
  mood: MoodLevel;
  intensity: 1 | 2 | 3 | 4 | 5;
  triggers?: string[];
  people?: string[];
  deadline?: 'today' | 'week' | 'month' | 'later' | 'none';
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

type SyncStatus = 'pending' | 'synced' | 'failed';
```

### 2.2 状态一致性规则

**父子状态联动逻辑：**

只有当 Entry 本身及所有附件都 synced 时，Entry 才标记为 synced。

```typescript
// 状态计算辅助函数
function computeEntrySyncStatus(entry: Entry): SyncStatus {
  if (!entry.audios?.length) return entry.syncStatus;
  
  const allSynced = entry.audios.every(a => a.syncStatus === 'synced');
  const anyFailed = entry.audios.some(a => a.syncStatus === 'failed');
  
  if (anyFailed) return 'failed';
  return allSynced ? 'synced' : 'pending';
}
```

### 2.3 多文件支持

预留 `audios?: AudioData[]` 数组设计，支持一条记录附多条语音。

---

## 三、UI交互设计

### 3.1 记录页布局

```
┌─────────────────────────────────┐
│  [情绪选择器 - 5级情绪图标]      │
│                                 │
│  [文字输入框 - 可多行]          │
│                                 │
│  [标签选择区 - 触发器/人物]     │
│                                 │
├─────────────────────────────────┤
│  📎 附件                         │
│  ┌─────────────────────────────┐ │
│  │ 🎤 按住说话                 │ │
│  │    （录音按钮/波形区）       │ │
│  └─────────────────────────────┘ │
│                                 │
│  [已录制的语音列表]             │
│  ▶ 00:30  早上的想法...    [×]  │
│  ▶ 01:15  录制于 14:30      [×] │
├─────────────────────────────────┤
│  [期限选择]  [保存按钮]         │
└─────────────────────────────────┘
```

### 3.2 录音状态机

```typescript
type RecordingState = 
  | 'idle'        // 空闲，显示"按住说话"
  | 'recording'   // 正在录音，显示"松开结束" + 波形
  | 'canceling'   // 向上滑动取消，显示"松开取消"
  | 'processing'  // 录音结束，正在处理文件
  | 'preview';    // 显示预览和播放/删除按钮
```

### 3.3 录音交互流程

**按住说话流程：**

1. 用户按住 🎤 按钮
2. 若按住 < 300ms 松开 → 忽略（误触保护）
3. 若向上滑动超过 30px → 进入 `canceling` 状态，显示"松开取消"
4. 正常松开 → 进入 `processing`，然后 `preview`
5. 显示录音预览：时长 + 播放/删除按钮
6. 可继续添加多条语音

**取消机制：**
- 向上滑动超过 30px 显示"松开取消"提示
- 松开手指取消本次录音，不保存

### 3.4 权限处理

- 首次点击时请求麦克风权限
- 权限拒绝 → 显示引导弹窗，跳转设置

### 3.5 已录制语音列表

```
语音列表：
┌────────────────────────────────┐
│ ▶ 03:15  早上的想法...    [×]  │
│ ▶ 01:30  录制于 14:30      [×] │
└────────────────────────────────┘
```

- 播放中：波形动画 + 暂停按钮
- 默认名称：「录制于 HH:mm」
- 点击条目可展开播放条或重命名

---

## 四、架构与组件

### 4.1 目录结构

```
components/
├── AudioRecorder/              # 新增
│   ├── index.ts                # 导出
│   ├── AudioRecorder.tsx       # 录音主组件
│   ├── RecordButton.tsx        # 按住说话按钮
│   ├── WaveformView.tsx        # 实时波形
│   ├── AudioPreview.tsx        # 录音预览
│   └── AudioList.tsx           # 语音列表
│
store/
├── modules/
│   └── audio.ts                # 新增：音频播放状态
```

### 4.2 核心组件

**AudioRecorder**
- 管理录音状态机
- 处理权限请求
- 调用 expo-av 录音

**RecordButton**
- 按住/滑动/释放手势检测
- 显示取消区域
- 震动反馈

**WaveformView**
- 实时音量可视化
- 性能降级方案（低端设备简化显示）

**AudioPreview**
- 播放/暂停控制
- 时长显示
- 删除/重命名

**AudioList**
- 语音条目列表
- 播放状态管理
- 同时只播一个

### 4.3 状态管理

```typescript
// store/modules/audio.ts
interface AudioState {
  // 播放状态
  currentAudioId: string | null;
  isPlaying: boolean;
  playbackPosition: number;
  duration: number;
  
  // 录音状态
  recordingState: RecordingState;
  recordingDuration: number;
  currentRecordingUri: string | null;
}

// actions
const useAudioStore = create<AudioState & AudioActions>((set, get) => ({
  // 播放控制
  playAudio: (audioId: string, uri: string) => void;
  pauseAudio: () => void;
  stopAudio: () => void;
  seekTo: (position: number) => void;
  
  // 录音控制
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioData | null>;
  cancelRecording: () => void;
}));
```

---

## 五、存储与同步方案

### 5.1 本地存储

**录音文件：**
- 存储路径：`FileSystem.documentDirectory/audios/{audioId}.m4a`
- 格式：m4a（AAC编码）
- 采样率：44.1kHz
- 比特率：64kbps（语音优化）
- 预期文件大小：约 500KB/分钟

### 5.2 云端同步

**Supabase Storage Bucket：**
```
bucket: "audios"
├── {userId}/
│   └── {audioId}.m4a
```

**上传时机：**
- 网络恢复时
- Entry 保存时触发
- 后台静默上传

**上传流程：**

1. 检查 `audios` 中 `syncStatus === 'pending'`
2. 计算 `fileHash` 校验完整性
3. 上传到 Storage → 获取 `remoteUrl`
4. 更新 `AudioData.syncStatus` → 'synced'
5. 更新 Entry syncStatus（聚合计算）

**下载流程：**

1. 从云端拉取 Entry 列表
2. 对于有 `remoteUrl` 但无本地文件的 `audios`
3. 下载到本地 `localUri`
4. 标记 `syncStatus` → 'synced'

### 5.3 删除级联

删除 Entry 时，同时删除本地音频文件。

---

## 六、播放功能设计

### 6.1 播放状态管理

**全局播放状态（Zustand）：**

```typescript
interface AudioPlayerState {
  currentAudioId: string | null;    // 当前播放的音频ID
  isPlaying: boolean;
  playbackPosition: number;         // 当前播放位置（秒）
  duration: number;                 // 总时长
}
```

**播放规则：**
- 同时只播放一个音频
- 新播放自动停止上一个
- 后台继续播放（支持 AirPlay 等）

### 6.2 EntryCard 音频展示

```
┌────────────────────────────────────┐
│ 🌤️  03月15日 14:30                │
│ "今天终于完成了项目，很有成就感"    │
│                                    │
│ 🎤 2条语音  ☔ 触发器1  👤 张三    │
└────────────────────────────────────┘
```

- 显示语音数量图标
- 点击图标展开播放或直接在卡片内播放
- 播放时显示进度和暂停按钮

---

## 七、错误处理与边缘场景

### 7.1 错误分类与处理

| 错误类型 | 处理方式 |
|---------|---------|
| 麦克风权限拒绝 | 显示引导弹窗，跳转设置 |
| 录音启动失败 | Toast提示，重试按钮 |
| 文件保存失败 | 本地缓存，稍后重试 |
| 上传失败 | 标记failed，自动重试3次 |
| 下载失败 | 使用remoteUrl在线播放 |
| 播放失败 | 提示用户检查网络/文件 |

### 7.2 离线场景

- 录音：始终可用（本地优先）
- 播放：优先本地，localUri不存在时尝试remoteUrl
- 同步：联网后自动补传/下载

### 7.3 数据一致性

- 删除Entry时，同时删除本地音频文件
- 卸载应用：提示用户音频文件将保留在系统相册

---

## 八、性能与体验优化

### 8.1 性能考虑

**波形动画降级：**

```typescript
const waveformType = devicePerformance === 'low' 
  ? 'simple-bars'    // 简单音量条
  : 'realtime-wave'; // 实时波形
```

### 8.2 用户体验

**震动反馈：**
- 开始录音：轻震动
- 结束录音：轻震动
- 取消录音：不同震动模式

**进度保存：**
- 录音过程中意外退出 → 保存已录内容
- 应用被系统杀死 → 恢复草稿

---

## 九、测试计划

### 9.1 功能测试

- [ ] 录音权限正常/拒绝场景
- [ ] 按住<300ms误触保护
- [ ] 滑动取消功能
- [ ] 多条语音录制/删除/重命名
- [ ] 播放/暂停/进度拖动
- [ ] Entry保存（纯文字/纯语音/混合）

### 9.2 同步测试

- [ ] 离线录制 → 联网上传
- [ ] 云端下载 → 本地播放
- [ ] Entry与AudioData状态一致性
- [ ] 上传失败重试
- [ ] 删除Entry级联删除音频

### 9.3 兼容性测试

- [ ] 低端/中端/高端设备
- [ ] 网络切换（WiFi → 4G → 离线）
- [ ] 应用前后台切换
- [ ] 系统来电中断

---

## 十、技术风险与应对

| 风险 | 应对措施 |
|------|---------|
| 音频文件占用大量存储 | 定期清理已同步的本地文件；提供存储空间提示 |
| 云端存储成本 | 先本地，确需云端才上传；压缩音频质量 |
| 跨设备播放 | remoteUrl支持在线播放作为降级方案 |
| 隐私合规 | 本地录音加密存储；云端传输使用HTTPS |
