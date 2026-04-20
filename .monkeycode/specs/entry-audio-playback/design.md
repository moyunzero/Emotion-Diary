# EntryCard 语音播放功能 - 技术设计

## 1. 概述

本设计文档描述在 `EntryCard` 展开状态下实现语音播放功能的详细技术方案。

## 2. 修改文件

| 文件 | 修改内容 |
|------|---------|
| `components/EntryCard.tsx` | 新增播放状态和 UI 组件 |
| `styles/components/EntryCard.styles.ts` | 新增播放区样式定义 |

## 3. 状态管理

### 3.1 新增状态

在 `EntryCard` 组件内部新增：

```typescript
const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
const [playbackPosition, setPlaybackPosition] = useState<number>(0);
const audioSoundRef = useRef<Audio.Sound | null>(null);
```

### 3.2 播放控制函数

```typescript
const handlePlayAudio = useCallback(async (audio: AudioData) => {
  try {
    // 如果正在播放同一个，暂停
    if (playingAudioId === audio.id) {
      await audioSoundRef.current?.pauseAsync();
      setPlayingAudioId(null);
      return;
    }
    
    // 停止上一个
    if (audioSoundRef.current) {
      await audioSoundRef.current.stopAsync();
      await audioSoundRef.current.unloadAsync();
    }
    
    // 加载新音频
    const uri = audio.localUri || audio.remoteUrl;
    if (!uri) {
      Alert.alert("播放失败", "录音文件已丢失");
      return;
    }
    
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          setPlaybackPosition(0);
        }
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis / 1000);
        }
      }
    );
    
    audioSoundRef.current = sound;
    setPlayingAudioId(audio.id);
  } catch (error) {
    console.error("Failed to play audio:", error);
    Alert.alert("播放失败", "无法播放录音，请重试");
  }
}, [playingAudioId]);
```

### 3.3 清理函数

```typescript
useEffect(() => {
  return () => {
    if (audioSoundRef.current) {
      audioSoundRef.current.stopAsync();
      audioSoundRef.current.unloadAsync();
    }
  };
}, []);
```

## 4. UI 组件

### 4.1 语音播放区代码

在 `EntryCard.tsx` 的展开状态标签区域下方添加：

```tsx
{/* 语音播放区 */}
{isExpanded && entry.audios && entry.audios.length > 0 && (
  <View style={styles.audioPlaySection}>
    <Text style={styles.audioPlaySectionTitle}>语音</Text>
    {entry.audios.map((audio) => (
      <TouchableOpacity
        key={audio.id}
        style={[
          styles.audioPlayItem,
          playingAudioId === audio.id && styles.audioPlayItemActive
        ]}
        onPress={() => handlePlayAudio(audio)}
        accessibilityRole="button"
        accessibilityLabel={`播放录音：${audio.name || '录制于 ' + new Date(audio.createdAt).toLocaleTimeString()}`}
      >
        {playingAudioId === audio.id ? (
          <Pause size={16} color="#6C63FF" />
        ) : (
          <Play size={16} color="#9CA3AF" />
        )}
        <Text
          style={[
            styles.audioPlayName,
            playingAudioId === audio.id && styles.audioPlayNameActive
          ]}
          numberOfLines={1}
        >
          {audio.name || `录制于 ${new Date(audio.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`}
        </Text>
        {playingAudioId === audio.id && (
          <Text style={styles.audioPlayDuration}>
            {formatDuration(playbackPosition)} / {formatDuration(audio.duration)}
          </Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
)}
```

### 4.2 辅助函数

```typescript
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
```

## 5. 样式定义

### 5.1 新增样式 (EntryCard.styles.ts)

```typescript
audioPlaySection: {
  marginTop: spacing.sm,
  paddingTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.border.light,
},

audioPlaySectionTitle: {
  fontSize: 12,
  fontWeight: "500",
  color: colors.text.secondary,
  marginBottom: spacing.xs,
},

audioPlayItem: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xs,
  borderRadius: borderRadius.sm,
  marginBottom: 4,
},

audioPlayItemActive: {
  backgroundColor: colors.background.highlight,
},

audioPlayName: {
  flex: 1,
  marginLeft: spacing.xs,
  fontSize: 13,
  color: colors.text.secondary,
},

audioPlayNameActive: {
  color: colors.primary,
  fontWeight: "500",
},

audioPlayDuration: {
  fontSize: 11,
  color: colors.primary,
  marginLeft: spacing.xs,
},
```

## 6. 错误处理

| 场景 | 处理 |
|------|------|
| 音频 URL 都不存在 | Alert 提示"录音文件已丢失" |
| 播放失败 | Alert 提示"播放失败，请重试" |
| 组件卸载 | 清理音频资源 |

## 7. 依赖

- `expo-av` - 已使用，无需新增
- `Play`/`Pause` 图标 - 需从 `lucide-react-native` 导入
