/**
 * @deprecated Phase 7 temporary compatibility.
 * 请优先使用 shared/responsive 作为单一入口，本文件仅保留旧 API 适配。
 */

import { Dimensions } from 'react-native';

import {
  BREAKPOINTS,
  createResponsiveMetrics,
  getDeviceTypeBySize,
  isLandscapeBySize,
} from '../shared/responsive';

const getWindowSize = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export { BREAKPOINTS };

export const getDeviceType = (): 'phone' | 'tablet' | 'desktop' => {
  const { width, height } = getWindowSize();
  return getDeviceTypeBySize(width, height);
};

// 响应式 padding
export const responsivePadding = {
  horizontal: (base: number = 20): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') {
      return metrics.padding.horizontal;
    }
    if (metrics.deviceType === 'tablet') {
      return base * 2;
    }
    return base;
  },
  vertical: (base: number = 16): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.5;
    if (metrics.deviceType === 'tablet') return base * 1.25;
    return base;
  },
  card: (base: number = 20): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.5;
    if (metrics.deviceType === 'tablet') return base * 1.25;
    return base;
  },
};

// 响应式字体大小
export const responsiveFontSize = {
  title: (base: number = 24): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.25;
    if (metrics.deviceType === 'tablet') return base * 1.125;
    return base;
  },
  cardTitle: (base: number = 16): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.125;
    if (metrics.deviceType === 'tablet') return base * 1.0625;
    return base;
  },
  body: (base: number = 14): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.071;
    if (metrics.deviceType === 'tablet') return base * 1.036;
    return base;
  },
  small: (base: number = 12): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.083;
    if (metrics.deviceType === 'tablet') return base * 1.042;
    return base;
  },
};

// 响应式间距
export const responsiveSpacing = {
  cardGap: (): number => {
    const { width, height } = getWindowSize();
    return createResponsiveMetrics(width, height).spacing.cardGap;
  },
  component: (base: number = 16): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    if (metrics.deviceType === 'desktop') return base * 1.5;
    if (metrics.deviceType === 'tablet') return base * 1.25;
    return base;
  },
};

// 获取最大内容宽度（用于居中布局）
export const getMaxContentWidth = (): number => {
  const { width, height } = getWindowSize();
  return createResponsiveMetrics(width, height).layout.maxContentWidth;
};

// 响应式图标大小
export const responsiveIconSize = {
  small: (): number => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 20 : deviceType === 'tablet' ? 18 : 16;
  },
  medium: (): number => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 28 : deviceType === 'tablet' ? 24 : 20;
  },
  large: (): number => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 36 : deviceType === 'tablet' ? 32 : 28;
  },
};

// 响应式圆角
export const responsiveBorderRadius = {
  card: (): number => {
    const { width, height } = getWindowSize();
    return createResponsiveMetrics(width, height).borderRadius.card;
  },
  large: (): number => {
    const { width, height } = getWindowSize();
    return createResponsiveMetrics(width, height).borderRadius.large;
  },
};

// 响应式网格布局（用于关系花盆等）
export const responsiveGrid = {
  columns: (): number => {
    const { width, height } = getWindowSize();
    return createResponsiveMetrics(width, height).layout.gridColumns;
  },
  itemWidth: (gap: number = 8): number => {
    const { width, height } = getWindowSize();
    const metrics = createResponsiveMetrics(width, height);
    const availableWidth = Math.min(
      width - metrics.padding.horizontal * 2 - metrics.padding.card * 2,
      metrics.layout.maxContentWidth - metrics.padding.horizontal * 2 - metrics.padding.card * 2
    );
    const totalGap = gap * (metrics.layout.gridColumns - 1);
    return (availableWidth - totalGap) / metrics.layout.gridColumns;
  },
  gap: (): number => {
    const { width, height } = getWindowSize();
    return createResponsiveMetrics(width, height).layout.gridGap;
  },
};

// 检查是否为横屏
export const isLandscape = (): boolean => {
  const { width, height } = getWindowSize();
  return isLandscapeBySize(width, height);
};

// 导出屏幕尺寸（用于调试）
export const SCREEN_INFO = {
  width: getWindowSize().width,
  height: getWindowSize().height,
  type: getDeviceType(),
  isLandscape: isLandscape(),
};
