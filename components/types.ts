/**
 * 组件 Props 类型定义
 * 统一管理所有组件的 Props 接口
 */

import { ViewStyle } from 'react-native';
import { EmotionForecast, EmotionPodcast, MoodEntry, User, WeatherState } from '../types';

/**
 * 通用组件 Props
 */
export interface BaseComponentProps {
  /** 自定义样式 */
  style?: ViewStyle;
  /** 测试 ID */
  testID?: string;
}

/**
 * EntryCard 组件 Props
 */
export interface EntryCardProps extends BaseComponentProps {
  /** 情绪条目 */
  entry: MoodEntry;
  /** 点击事件 */
  onPress?: (entry: MoodEntry) => void;
  /** 长按事件 */
  onLongPress?: (entry: MoodEntry) => void;
  /** 解决事件 */
  onResolve?: (id: string) => void;
  /** 焚烧事件 */
  onBurn?: (id: string) => void;
  /** 删除事件 */
  onDelete?: (id: string) => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
}

/**
 * MoodForm 组件 Props
 */
export interface MoodFormProps extends BaseComponentProps {
  /** 提交事件 */
  onSubmit: (entry: Omit<MoodEntry, 'id' | 'timestamp' | 'status'>) => void;
  /** 取消事件 */
  onCancel?: () => void;
  /** 初始值（用于编辑） */
  initialValues?: Partial<MoodEntry>;
  /** 是否为编辑模式 */
  isEditing?: boolean;
}

/**
 * TagSelector 组件 Props
 */
export interface TagSelectorProps extends BaseComponentProps {
  /** 标签列表 */
  tags: string[];
  /** 已选中的标签 */
  selectedTags: string[];
  /** 选择变化事件 */
  onChange: (tags: string[]) => void;
  /** 最大选择数量 */
  maxSelection?: number;
  /** 是否允许添加自定义标签 */
  allowCustom?: boolean;
}

/**
 * Avatar 组件 Props
 */
export interface AvatarProps extends BaseComponentProps {
  /** 用户信息 */
  user: User | null;
  /** 头像大小 */
  size?: 'small' | 'medium' | 'large';
  /** 点击事件 */
  onPress?: () => void;
  /** 是否显示在线状态 */
  showOnlineStatus?: boolean;
}

/**
 * WeatherStation 组件 Props
 */
export interface WeatherStationProps extends BaseComponentProps {
  /** 天气状态 */
  weather: WeatherState;
  /** 点击事件 */
  onPress?: () => void;
  /** 是否显示详细信息 */
  showDetails?: boolean;
}

/**
 * Dashboard 组件 Props
 */
export interface DashboardProps extends BaseComponentProps {
  /** 条目列表 */
  entries: MoodEntry[];
  /** 天气状态 */
  weather: WeatherState;
  /** 刷新事件 */
  onRefresh?: () => void;
  /** 是否正在刷新 */
  refreshing?: boolean;
  /** 条目点击事件 */
  onEntryPress?: (entry: MoodEntry) => void;
}

/**
 * Insights 组件 Props
 */
export interface InsightsProps extends BaseComponentProps {
  /** 条目列表 */
  entries: MoodEntry[];
  /** 情绪预测 */
  forecast: EmotionForecast | null;
  /** 情绪播客 */
  podcast: EmotionPodcast | null;
  /** 生成预测事件 */
  onGenerateForecast?: (days: number) => void;
  /** 生成播客事件 */
  onGeneratePodcast?: (period: 'week' | 'month') => void;
}

/**
 * BurnAnimation 组件 Props
 */
export interface BurnAnimationProps extends BaseComponentProps {
  /** 是否可见 */
  visible: boolean;
  /** 动画完成事件 */
  onComplete?: () => void;
  /** 动画持续时间（毫秒） */
  duration?: number;
}

/**
 * Toast 组件 Props
 */
export interface ToastProps {
  /** 消息内容 */
  message: string;
  /** 消息类型 */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** 持续时间（毫秒） */
  duration?: number;
  /** 是否可见 */
  visible: boolean;
  /** 关闭事件 */
  onClose?: () => void;
}

/**
 * EditEntryModal 组件 Props
 */
export interface EditEntryModalProps {
  /** 是否可见 */
  visible: boolean;
  /** 要编辑的条目 */
  entry: MoodEntry | null;
  /** 保存事件 */
  onSave: (id: string, updates: Partial<MoodEntry>) => void;
  /** 取消事件 */
  onCancel: () => void;
}

/**
 * AddTagInput 组件 Props
 */
export interface AddTagInputProps extends BaseComponentProps {
  /** 添加标签事件 */
  onAdd: (tag: string) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 最大长度 */
  maxLength?: number;
}

/**
 * EmotionPodcast 组件 Props
 */
export interface EmotionPodcastProps extends BaseComponentProps {
  /** 播客内容 */
  podcast: EmotionPodcast | null;
  /** 生成事件 */
  onGenerate?: (period: 'week' | 'month') => void;
  /** 是否正在生成 */
  isGenerating?: boolean;
}

/**
 * 按钮组件 Props
 */
export interface ButtonProps extends BaseComponentProps {
  /** 按钮文本 */
  title: string;
  /** 点击事件 */
  onPress: () => void;
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** 按钮大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 图标名称 */
  icon?: string;
  /** 图标位置 */
  iconPosition?: 'left' | 'right';
}

/**
 * 输入框组件 Props
 */
export interface InputProps extends BaseComponentProps {
  /** 输入值 */
  value: string;
  /** 值变化事件 */
  onChangeText: (text: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 是否多行 */
  multiline?: boolean;
  /** 行数 */
  numberOfLines?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 错误消息 */
  error?: string;
  /** 标签文本 */
  label?: string;
  /** 输入类型 */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  /** 是否安全输入（密码） */
  secureTextEntry?: boolean;
}

/**
 * 列表项组件 Props
 */
export interface ListItemProps extends BaseComponentProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle?: string;
  /** 左侧图标 */
  leftIcon?: string;
  /** 右侧图标 */
  rightIcon?: string;
  /** 点击事件 */
  onPress?: () => void;
  /** 是否显示分隔线 */
  showDivider?: boolean;
}

/**
 * 卡片组件 Props
 */
export interface CardProps extends BaseComponentProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 标题 */
  title?: string;
  /** 是否可点击 */
  pressable?: boolean;
  /** 点击事件 */
  onPress?: () => void;
  /** 阴影深度 */
  elevation?: number;
}
