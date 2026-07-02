/**
 * 颜色常量
 * 统一管理应用中使用的所有颜色
 */

export const COLORS = {
  // 主色调
  primary: '#FDA4AF',
  primaryDark: '#FB7185',
  primaryLight: '#FECDD3',
  
  // 情绪等级颜色（粉系递进，与疗愈基调一致）
  mood: {
    level1: '#FFF1F2',
    level2: '#FECDD3',
    level3: '#FDA4AF',
    level4: '#FB7185',
    level5: '#E11D48',
    /** 记一笔 / 卡片图标色：同一玫瑰色相由浅到深，勿混用紫/蓝 */
    icon: {
      level1: '#FDA4AF',
      level2: '#F9A8B4',
      level3: '#FB7185',
      level4: '#F43F5E',
      level5: '#E11D48',
    },
  },
  
  // 状态颜色
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // 功能性颜色（submit 仅 destructive，品牌 CTA 用 primaryDark）
  submit: '#EF4444',
  accent: '#86EFAC',

  // 录音 UI（映射粉系，替代旧 #6C63FF）
  audio: {
    primary: '#FB7185',
    surface: '#F5F3FF',
  },
  
  // 中性色
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // 背景色（粉色疗愈基调）
  background: {
    primary: '#FFFFFF',
    secondary: '#FFF5F7',
    tertiary: '#FFE4E6',
    page: '#FFF5F7',
    gradientStart: '#FFF5F7',
    gradientEnd: '#FFE4E6',
  },

  // Tab 导航
  tab: {
    active: '#FB7185',
    inactive: '#9CA3AF',
  },

  // 页面氛围叠层（气象站 / 花园，粉系柔光）
  atmosphere: {
    sunny: '#FFF1F2',
    cloudy: '#FAF5FF',
    rainy: '#F5F3FF',
    stormy: '#FFE4E6',
  },

  // 关系天气卡片（内层卡片，与页面粉调一致）
  weatherCard: {
    sunny: {
      bg: '#FFF1F2',
      text: '#9F1239',
      icon: '#FB7185',
    },
    cloudy: {
      bg: '#FAF5FF',
      text: '#6B21A8',
      icon: '#C084FC',
    },
    rainy: {
      bg: '#EDE9FE',
      text: '#5B21B6',
      icon: '#A78BFA',
    },
    stormy: {
      bg: '#FFE4E6',
      text: '#BE123C',
      icon: '#FB7185',
    },
  },

  // 仪式语义色
  ritual: {
    resolve: '#86EFAC',
    burn: '#F97316',
  },
  
  // 文本颜色
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // 边框颜色
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // 阴影颜色
  shadow: {
    primary: '#000000',
    submit: '#FB7185',
  },
  
  // 天气图标 / 光斑（粉紫柔色，避免黄绿跳色）
  weather: {
    sunny: '#FDA4AF',
    cloudy: '#C084FC',
    rainy: '#A78BFA',
    stormy: '#FB7185',
  },
  
  // 截止日期颜色
  deadline: {
    today: {
      bg: '#FEE2E2',
      text: '#991B1B',
    },
    week: {
      bg: '#FED7AA',
      text: '#9A3412',
    },
    month: {
      bg: '#FFE4E6',
      text: '#BE123C',
    },
    later: {
      bg: '#FAF5FF',
      text: '#6B21A8',
    },
    self: {
      bg: '#F3F4F6',
      text: '#374151',
    },
  },
} as const;

// 设计 Token
export const DESIGN_TOKENS = {
  borderRadius: {
    xs: 4,
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
} as const;

/**
 * 透明度辅助函数
 * 将十六进制颜色转换为带透明度的颜色
 */
export const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
