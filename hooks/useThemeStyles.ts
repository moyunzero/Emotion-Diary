import { useMemo } from 'react';
import { getColors } from '../constants/colors';
import { DESIGN_TOKENS } from '../constants/colors';
import { getScreenHeaderTokens } from '../styles/screenHeaderTokens';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook: 获取当前主题的样式
 * 用于在组件中动态生成基于主题的样式
 */
export const useThemeStyles = () => {
  const effectiveColorScheme = useAppStore(
    (state) => state.effectiveColorScheme,
  );

  return useMemo(() => {
    const colors = getColors(effectiveColorScheme);
    return {
      colors,
      tokens: DESIGN_TOKENS,
      screenHeader: getScreenHeaderTokens(colors),
      effectiveColorScheme,
    };
  }, [effectiveColorScheme]);
};

/**
 * Hook: 创建基于主题的动态样式
 * 用于需要根据主题动态调整的样式
 */
export const useDynamicStyles = <T extends Record<string, unknown>>(
  styleFactory: (theme: ReturnType<typeof useThemeStyles>) => T,
): T => {
  const themeStyles = useThemeStyles();
  return useMemo(() => styleFactory(themeStyles), [styleFactory, themeStyles]);
};
