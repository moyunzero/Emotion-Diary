import { useMemo } from 'react';
import { COLORS, DESIGN_TOKENS } from '../constants/colors';

/**
 * Hook: 获取当前主题的样式
 * 用于在组件中动态生成基于主题的样式
 * 注意：主题切换功能已移除，现在只返回固定的浅色主题
 */
export const useThemeStyles = () => {
  return useMemo(() => ({
    colors: COLORS,
    tokens: DESIGN_TOKENS,
  }), []);
};

/**
 * Hook: 创建基于主题的动态样式
 * 用于需要根据主题动态调整的样式
 * 注意：主题切换功能已移除，现在只返回固定的浅色主题
 */
export const useDynamicStyles = <T extends Record<string, any>>(
  styleFactory: (theme: ReturnType<typeof useThemeStyles>) => T
): T => {
  const themeStyles = useThemeStyles();
  return useMemo(() => styleFactory(themeStyles), [themeStyles]);
};
