import { Canvas, Fill, ImageShader, Shader, SkImage, Skia } from '@shopify/react-native-skia';
import { CheckCircle, Edit, Flame, Trash2 } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { DEADLINE_CONFIG, MOOD_CONFIG } from '../constants';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { useAppStore } from '../store/useAppStore';
import { Deadline, MoodEntry, MoodLevel, Status } from '../types';
import { formatDateChinese } from '../utils/dateUtils';
import { getMoodIcon } from '../utils/moodIconUtils';
import EditEntryModal from './EditEntryModal';

interface Props {
  entry: MoodEntry;
  // 修改回调签名：同时传递 id 和 text
  onBurn?: (id: string, text: string) => void;
}

// 确保Android LayoutAnimation配置生效（在应用启动时执行）
// 这个配置应该在应用启动时执行一次，但为了确保，我们在使用时也会检查
const ensureLayoutAnimationEnabled = () => {
  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
};

// 立即执行一次，确保配置生效
ensureLayoutAnimationEnabled();

const burnShaderCode = `
uniform shader image;
uniform float progress;

// 伪随机函数
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 噪声函数
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

vec4 main(vec2 pos) {
    vec4 color = image.eval(pos);
    if (color.a == 0.0) {
        return vec4(0.0);
    }

    // 噪声缩放
    float n = noise(pos / 20.0);
    
    // 阈值计算
    float t = progress * 1.4 - 0.2; 

    if (n < t) {
        // 烧毁区域：完全透明
        return vec4(0.0); 
    } 
    
    float edge = n - t;
    
    if (edge < 0.05) {
        // 内层火焰：亮黄色/白色
        return vec4(1.0, 0.9, 0.5, 1.0);
    } else if (edge < 0.15) {
        // 外层火焰：橙红色
        return vec4(1.0, 0.4, 0.0, 1.0);
    } else if (edge < 0.25) {
        // 焦黑边缘：深褐色/黑色，与原图混合
        return mix(vec4(0.2, 0.1, 0.0, 1.0), color, (edge - 0.15) * 10.0);
    }
    
    return color;
}
`;

// 预编译 Shader（如果失败则返回null，用于降级处理）
let runtimeEffect: any = null;
try {
  runtimeEffect = Skia.RuntimeEffect.Make(burnShaderCode);
} catch (e) {
  console.warn('Skia RuntimeEffect创建失败，燃烧动画将使用降级方案:', e);
  runtimeEffect = null;
}

const makeImageFromView = async (viewRef: React.RefObject<View | null>): Promise<SkImage | null> => {
  try {
    if (!viewRef.current) return null;
    const uri = await captureRef(viewRef.current, {
      format: 'png',
      quality: 1,
      result: 'base64',
    });
    const data = Skia.Data.fromBase64(uri);
    return Skia.Image.MakeImageFromEncoded(data);
  } catch (e) {
    console.error('Screenshot failed', e);
    return null;
  }
};

const EntryCard: React.FC<Props> = ({ entry, onBurn }) => {
  const resolveEntry = useAppStore((state) => state.resolveEntry);
  const deleteEntry = useAppStore((state) => state.deleteEntry);
  const { trigger: triggerHaptic } = useHapticFeedback();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isResolved = entry.status === Status.RESOLVED;
  
  const moodConfig = MOOD_CONFIG[entry.moodLevel] || MOOD_CONFIG[MoodLevel.ANNOYED];
  const deadlineLabel = DEADLINE_CONFIG[entry.deadline as Deadline]?.label || entry.deadline;

  // Burning effect state
  const viewRef = useRef<View>(null);
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [isBurning, setIsBurning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  
  // 使用 React State 而不是 Reanimated SharedValue 来驱动动画
  // 这样可以完全避开 Reanimated 和 Skia 之间的 JSI 桥接问题
  const [burnProgress, setBurnProgress] = useState(0);

  const handleResolve = () => {
    triggerHaptic('success');
    resolveEntry(entry.id);
    setIsExpanded(false); // 操作完成后折叠卡片
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除这条记录吗？\n\n"${entry.content.substring(0, 30)}${entry.content.length > 30 ? '...' : ''}"`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('error');
            deleteEntry(entry.id);
            setIsExpanded(false); // 操作完成后折叠卡片
          },
        },
      ]
    );
  };

  const handleBurn = async () => {
    if (!onBurn || isPreparing) return;
    
    Alert.alert(
      '确认焚烧',
      '确定要焚烧这条记录吗？焚烧后无法恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认焚烧',
          style: 'destructive',
          onPress: async () => {
            setIsPreparing(true);
            triggerHaptic('medium');
            
            // 检查Skia是否可用（降级方案）
            const isSkiaAvailable = runtimeEffect !== null;
            
            // 给一点时间让 UI 响应 loading 状态
            setTimeout(async () => {
              try {
                // 如果Skia不可用，直接删除，不显示动画
                if (!isSkiaAvailable) {
                  console.log('Skia不可用，使用降级方案：直接删除');
                  onBurn(entry.id, entry.content);
                  setIsPreparing(false);
                  return;
                }
                
                // 1. 截图
                const image = await makeImageFromView(viewRef);
                
                if (image) {
                  setSnapshot(image);
                  setIsBurning(true); // 切换到 Skia 视图
                  
                  // 2. 开始动画 (使用 requestAnimationFrame，但优化更新频率)
                  let start = performance.now();
                  const duration = 2000;
                  let animationFrameId: number | null = null;
                  let lastUpdateTime = start;
                  let lastProgress = 0; // 跟踪上次的进度值

                  const animate = (time: number) => {
                    const elapsed = time - start;
                    const p = Math.min(elapsed / duration, 1);
                    
                    // 优化：只在进度有明显变化时更新状态（减少重渲染次数）
                    // 每16ms（约60fps）更新一次，或者进度变化超过0.02时更新
                    const timeSinceLastUpdate = time - lastUpdateTime;
                    const progressChange = Math.abs(p - lastProgress);
                    
                    if (timeSinceLastUpdate >= 16 || progressChange >= 0.02 || p >= 1) {
                      setBurnProgress(p);
                      lastProgress = p;
                      lastUpdateTime = time;
                    }

                    if (p < 1) {
                      animationFrameId = requestAnimationFrame(animate);
                    } else {
                      // 动画结束
                      setBurnProgress(1); // 确保最终状态
                      onBurn(entry.id, entry.content);
                      // 重置状态 (虽然组件可能已经被卸载或重新渲染)
                      setIsBurning(false);
                      setIsPreparing(false);
                    }
                  };
                  
                  animationFrameId = requestAnimationFrame(animate);
                  
                  // 设置超时保护，防止动画卡死
                  setTimeout(() => {
                    if (animationFrameId !== null) {
                      cancelAnimationFrame(animationFrameId);
                      onBurn(entry.id, entry.content);
                      setIsBurning(false);
                      setIsPreparing(false);
                    }
                  }, duration + 500); // 比动画时长多500ms
                  
                  // 注意：清理函数应该在useEffect中返回，而不是在这里
                  // 这里只是一个异步函数，无法返回清理函数
                } else {
                  // 截图失败降级处理
                  console.log('截图失败，使用降级方案：直接删除');
                  onBurn(entry.id, entry.content);
                  setIsPreparing(false);
                }
              } catch (e) {
                console.error('Burn effect failed:', e);
                // 降级处理：直接删除
                onBurn(entry.id, entry.content);
                setIsPreparing(false);
              }
            }, 50);
          },
        },
      ]
    );
  };

  const getMoodColor = () => {
    switch (entry.moodLevel) {
      case MoodLevel.ANNOYED: return '#FEF3C7';
      case MoodLevel.UPSET: return '#FED7AA';
      case MoodLevel.ANGRY: return '#FEE2E2';
      case MoodLevel.FURIOUS: return '#FECACA';
      case MoodLevel.EXPLOSIVE: return '#FCA5A5';
      default: return '#FEF3C7';
    }
  };

  // 使用统一的时间戳格式化函数
  const formatEntryDate = (timestamp: number) => {
    return formatDateChinese(timestamp);
  };

  // 如果正在燃烧且有截图和 Shader，渲染 Skia Canvas
  if (isBurning && snapshot && runtimeEffect) {
    return (
      <View style={[styles.wrapper, { width: layout.width, height: layout.height }]}>
        <Canvas style={{ flex: 1 }}>
          <Fill>
            {/* 直接传递普通 JS 对象给 uniforms，避免 Reanimated 桥接问题 */}
            <Shader source={runtimeEffect} uniforms={{ progress: burnProgress }}>
              <ImageShader
                image={snapshot} 
                fit="cover" 
                rect={{ x: 0, y: 0, width: layout.width, height: layout.height }} 
              />
            </Shader>
          </Fill>
        </Canvas>
      </View>
    );
  }

  const handleEdit = () => {
    triggerHaptic('light');
    setIsEditModalVisible(true);
  };

  return (
    <>
      <View 
        style={styles.wrapper} 
        ref={viewRef} 
        collapsable={false}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
      >
          <Animated.View style={[styles.container, isResolved && styles.resolvedContainer]}>
            <TouchableOpacity 
              onPress={() => {
                // 确保Android LayoutAnimation配置生效
                ensureLayoutAnimationEnabled();
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsExpanded(!isExpanded);
              }} 
              activeOpacity={1}
            >
            <View style={styles.content}>
              {/* Mood Icon Badge */}
              <View style={[styles.moodIconBadge, { backgroundColor: getMoodColor() }]}>
                {getMoodIcon(moodConfig.iconName, '#FFFFFF', 20)}
              </View>

              {/* Content */}
              <View style={styles.textContainer}>
                <View style={styles.header}>
                  <Text style={styles.peopleText} numberOfLines={1}>
                    {entry.people.join(', ')}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatEntryDate(entry.timestamp)}
                  </Text>
                </View>
                <Text style={styles.contentText} numberOfLines={isExpanded ? undefined : 3}>
                  {entry.content}
                </Text>
                
                {/* Tags */}
                <View style={styles.tagsContainer}>
                  <View style={styles.deadlineTag}>
                    <Text style={styles.deadlineText}>{deadlineLabel}</Text>
                  </View>
                  {entry.triggers.map((t, index) => (
                    <View key={index} style={styles.triggerTag}>
                      <Text style={styles.triggerText}>#{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded Actions */}
          {isExpanded && !isResolved && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <View style={styles.actionIcon}>
                  <Edit size={20} color="#3B82F6" />
                </View>
                <Text style={styles.actionText}>编辑</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleResolve}
              >
                <View style={styles.actionIcon}>
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <Text style={styles.actionText}>和解打卡</Text>
              </TouchableOpacity>

              {onBurn && (
                <TouchableOpacity 
                  style={[styles.actionButton, isPreparing && { opacity: 0.5 }]}
                  onPress={handleBurn}
                  disabled={isPreparing}
                >
                  {isPreparing ? (
                    <ActivityIndicator size="small" color="#F97316" />
                  ) : (
                    <>
                      <View style={styles.actionIcon}>
                        <Flame size={20} color="#F97316" />
                      </View>
                      <Text style={styles.actionText}>气话焚烧</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <View style={styles.actionIcon}>
                  <Trash2 size={20} color="#9CA3AF" />
                </View>
                <Text style={styles.actionText}>删除</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
      
      {/* 编辑模态框 */}
      <EditEntryModal
        entry={entry}
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          triggerHaptic('success');
          setIsExpanded(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // marginHorizontal: 16, // Moved to wrapper
    // marginVertical: 8,    // Moved to wrapper
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resolvedContainer: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  moodIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  peopleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  contentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deadlineTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deadlineText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  triggerTag: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  triggerText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
});

export default EntryCard;
