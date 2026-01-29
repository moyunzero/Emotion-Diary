/**
 * 响应式工具函数
 * 根据屏幕尺寸动态计算合适的间距、字体大小等
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 断点定义（参考常见设备尺寸）
export const BREAKPOINTS = {
  small: 375,    // iPhone SE, 小屏手机
  medium: 414,   // iPhone 11 Pro Max, 标准手机
  large: 768,    // iPad Mini, 小平板
  xlarge: 1024,  // iPad Pro, 大平板/小笔记本
  xxlarge: 1440, // 桌面显示器
};

// 判断设备类型
export const getDeviceType = (): 'phone' | 'tablet' | 'desktop' => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  const isTablet = SCREEN_WIDTH >= BREAKPOINTS.large && aspectRatio < 1.6;
  const isDesktop = SCREEN_WIDTH >= BREAKPOINTS.xlarge;
  
  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'phone';
};

// 响应式 padding
export const responsivePadding = {
  // 水平内边距
  horizontal: (base: number = 20) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        // 桌面端：根据屏幕宽度计算，但不超过最大内容宽度
        const maxContentWidth = 1200;
        const availableWidth = Math.min(SCREEN_WIDTH - 40, maxContentWidth);
        return (SCREEN_WIDTH - availableWidth) / 2;
      case 'tablet':
        return base * 2; // 平板：40px
      case 'phone':
      default:
        return base; // 手机：20px
    }
  },
  // 垂直内边距
  vertical: (base: number = 16) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.5;
      case 'tablet':
        return base * 1.25;
      default:
        return base;
    }
  },
  // 卡片内边距
  card: (base: number = 20) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.5; // 30px
      case 'tablet':
        return base * 1.25; // 25px
      default:
        return base; // 20px
    }
  },
};

// 响应式字体大小
export const responsiveFontSize = {
  // 标题字号
  title: (base: number = 24) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.25; // 30px
      case 'tablet':
        return base * 1.125; // 27px
      default:
        return base; // 24px
    }
  },
  // 卡片标题字号
  cardTitle: (base: number = 16) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.125; // 18px
      case 'tablet':
        return base * 1.0625; // 17px
      default:
        return base; // 16px
    }
  },
  // 正文字号
  body: (base: number = 14) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.071; // 15px
      case 'tablet':
        return base * 1.036; // 14.5px
      default:
        return base; // 14px
    }
  },
  // 小字号
  small: (base: number = 12) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.083; // 13px
      case 'tablet':
        return base * 1.042; // 12.5px
      default:
        return base; // 12px
    }
  },
};

// 响应式间距
export const responsiveSpacing = {
  // 卡片间距
  cardGap: () => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return 24;
      case 'tablet':
        return 20;
      default:
        return 16;
    }
  },
  // 组件内部间距
  component: (base: number = 16) => {
    const deviceType = getDeviceType();
    switch (deviceType) {
      case 'desktop':
        return base * 1.5;
      case 'tablet':
        return base * 1.25;
      default:
        return base;
    }
  },
};

// 获取最大内容宽度（用于居中布局）
export const getMaxContentWidth = (): number => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case 'desktop':
      return 1200; // 桌面端最大宽度
    case 'tablet':
      return 700; // 平板最大宽度
    default:
      return SCREEN_WIDTH; // 手机全宽
  }
};

// 响应式图标大小
export const responsiveIconSize = {
  small: () => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 20 : deviceType === 'tablet' ? 18 : 16;
  },
  medium: () => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 28 : deviceType === 'tablet' ? 24 : 20;
  },
  large: () => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 36 : deviceType === 'tablet' ? 32 : 28;
  },
};

// 响应式圆角
export const responsiveBorderRadius = {
  card: () => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 16 : deviceType === 'tablet' ? 14 : 12;
  },
  large: () => {
    const deviceType = getDeviceType();
    return deviceType === 'desktop' ? 24 : deviceType === 'tablet' ? 20 : 16;
  },
};

// 响应式网格布局（用于关系花盆等）
export const responsiveGrid = {
  // 计算每行显示数量（根据实际屏幕宽度动态计算）
  columns: () => {
    const deviceType = getDeviceType();
    const horizontalPadding = responsivePadding.horizontal();
    const cardPadding = responsivePadding.card();
    // 计算可用宽度（减去卡片内边距）
    const availableWidth = Math.min(
      SCREEN_WIDTH - horizontalPadding * 2 - cardPadding * 2,
      getMaxContentWidth() - horizontalPadding * 2 - cardPadding * 2
    );
    
    // 每个项目的最小宽度（包括图标56px + 一些边距）
    const minItemWidth = 90;
    // gap 间距
    const gap = 8;
    
    // 根据可用宽度动态计算列数
    let columns = Math.floor((availableWidth + gap) / (minItemWidth + gap));
    
    // 根据设备类型设置最小和最大列数限制
    switch (deviceType) {
      case 'desktop':
        columns = Math.max(4, Math.min(columns, 5)); // 桌面：4-5列
        break;
      case 'tablet':
        columns = Math.max(3, Math.min(columns, 4)); // 平板：3-4列
        break;
      default:
        // 手机：根据屏幕宽度动态计算，但至少2列，最多4列
        // iPhone 16 Pro (393px) 可以显示4列
        if (SCREEN_WIDTH >= 390) {
          columns = Math.max(3, Math.min(columns, 4)); // 大屏手机：3-4列
        } else {
          columns = Math.max(2, Math.min(columns, 3)); // 小屏手机：2-3列
        }
        break;
    }
    
    return columns;
  },
  // 计算项目宽度（考虑gap）
  itemWidth: (gap: number = 8) => {
    const columns = responsiveGrid.columns();
    const horizontalPadding = responsivePadding.horizontal();
    const cardPadding = responsivePadding.card();
    const availableWidth = Math.min(
      SCREEN_WIDTH - horizontalPadding * 2 - cardPadding * 2,
      getMaxContentWidth() - horizontalPadding * 2 - cardPadding * 2
    );
    const totalGap = gap * (columns - 1);
    return (availableWidth - totalGap) / columns;
  },
  // 获取响应式 gap
  gap: () => {
    const deviceType = getDeviceType();
    // 减少 gap 以更紧凑的布局
    return deviceType === 'desktop' ? 10 : deviceType === 'tablet' ? 8 : 8;
  },
};

// 检查是否为横屏
export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

// 导出屏幕尺寸（用于调试）
export const SCREEN_INFO = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  type: getDeviceType(),
  isLandscape: isLandscape(),
};
