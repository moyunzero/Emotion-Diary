/**
 * 颜色常量
 * 统一管理应用中使用的所有颜色
 */

export const COLORS = {
  // 主色调
  primary: '#FDA4AF',
  primaryDark: '#FB7185',
  primaryLight: '#FECDD3',
  
  // 情绪等级颜色
  mood: {
    level1: '#F59E0B', // 黄色 - 轻微委屈
    level2: '#F97316', // 橙色 - 心情低落
    level3: '#EF4444', // 红色 - 感到生气
    level4: '#DC2626', // 深红色 - 非常愤怒
    level5: '#991B1B', // 最深红色 - 情绪爆发
  },
  
  // 状态颜色
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // 功能性颜色
  submit: '#EF4444',
  accent: '#86EFAC',
  
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
  
  // 背景色
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    page: '#FEF2F2',
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
    submit: '#EF4444',
  },
  
  // 天气状态颜色
  weather: {
    sunny: '#FCD34D',
    cloudy: '#9CA3AF',
    rainy: '#60A5FA',
    stormy: '#DC2626',
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
      bg: '#FEF3C7',
      text: '#92400E',
    },
    later: {
      bg: '#DBEAFE',
      text: '#1E40AF',
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
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
