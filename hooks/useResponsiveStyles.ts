/**
 * 响应式样式 Hook
 * 用于在组件中动态生成响应式样式
 */

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { createResponsiveMetrics } from '../shared/responsive';

export const useResponsiveStyles = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => {
      const metrics = createResponsiveMetrics(width, height);
      return {
      // 内边距
      padding: {
        horizontal: metrics.padding.horizontal,
        vertical: metrics.padding.vertical,
        card: metrics.padding.card,
      },
      // 字体大小
      fontSize: {
        title: metrics.fontSize.title,
        cardTitle: metrics.fontSize.cardTitle,
        body: metrics.fontSize.body,
        small: metrics.fontSize.small,
      },
      // 间距
      spacing: {
        cardGap: metrics.spacing.cardGap,
        component: metrics.spacing.component,
      },
      // 圆角
      borderRadius: {
        card: metrics.borderRadius.card,
        large: metrics.borderRadius.large,
      },
      // 布局
      layout: {
        maxContentWidth: metrics.layout.maxContentWidth,
        gridColumns: metrics.layout.gridColumns,
        gridItemWidth: metrics.layout.gridItemWidth,
      },
    };
    },
    [width, height]
  );
};
