/**
 * 响应式样式 Hook
 * 用于在组件中动态生成响应式样式
 */

import { useMemo } from 'react';
import {
  responsiveBorderRadius,
  responsiveFontSize,
  responsivePadding,
  responsiveSpacing,
  getMaxContentWidth,
  responsiveGrid,
} from '../utils/responsiveUtils';

export const useResponsiveStyles = () => {
  return useMemo(
    () => ({
      // 内边距
      padding: {
        horizontal: responsivePadding.horizontal(),
        vertical: responsivePadding.vertical(),
        card: responsivePadding.card(),
      },
      // 字体大小
      fontSize: {
        title: responsiveFontSize.title(),
        cardTitle: responsiveFontSize.cardTitle(),
        body: responsiveFontSize.body(),
        small: responsiveFontSize.small(),
      },
      // 间距
      spacing: {
        cardGap: responsiveSpacing.cardGap(),
        component: responsiveSpacing.component(16),
      },
      // 圆角
      borderRadius: {
        card: responsiveBorderRadius.card(),
        large: responsiveBorderRadius.large(),
      },
      // 布局
      layout: {
        maxContentWidth: getMaxContentWidth(),
        gridColumns: responsiveGrid.columns(),
        gridItemWidth: responsiveGrid.itemWidth(12),
      },
    }),
    []
  );
};
