import { BREAKPOINTS, LAYOUT } from './tokens';

export type DeviceType = 'phone' | 'tablet' | 'desktop';

export type ResponsiveMetrics = {
  width: number;
  height: number;
  deviceType: DeviceType;
  isLandscape: boolean;
  padding: {
    horizontal: number;
    vertical: number;
    card: number;
  };
  fontSize: {
    title: number;
    cardTitle: number;
    body: number;
    small: number;
  };
  spacing: {
    cardGap: number;
    component: number;
  };
  borderRadius: {
    card: number;
    large: number;
  };
  layout: {
    maxContentWidth: number;
    gridColumns: number;
    gridItemWidth: number;
    gridGap: number;
  };
};

function clampColumns(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function isLandscapeBySize(width: number, height: number): boolean {
  return width > height;
}

export function getDeviceTypeBySize(width: number, height: number): DeviceType {
  const aspectRatio = height / width;
  const isDesktop = width >= BREAKPOINTS.xlarge;
  const isTablet = width >= BREAKPOINTS.large && aspectRatio < 1.6;

  if (isDesktop) return 'desktop';
  if (isTablet) return 'tablet';
  return 'phone';
}

export function getMaxContentWidthBySize(width: number, height: number): number {
  const deviceType = getDeviceTypeBySize(width, height);
  if (deviceType === 'desktop') return LAYOUT.maxDesktopContentWidth;
  if (deviceType === 'tablet') return LAYOUT.maxTabletContentWidth;
  return width;
}

export function createResponsiveMetrics(width: number, height: number): ResponsiveMetrics {
  const deviceType = getDeviceTypeBySize(width, height);
  const isLandscape = isLandscapeBySize(width, height);
  const maxContentWidth = getMaxContentWidthBySize(width, height);

  const horizontalPadding = (() => {
    if (deviceType === 'desktop') {
      const availableWidth = Math.min(width - 40, LAYOUT.maxDesktopContentWidth);
      return (width - availableWidth) / 2;
    }
    if (deviceType === 'tablet') return 40;
    return 20;
  })();

  const verticalPadding = deviceType === 'desktop' ? 24 : deviceType === 'tablet' ? 20 : 16;
  const cardPadding = deviceType === 'desktop' ? 30 : deviceType === 'tablet' ? 25 : 20;
  const cardGap = deviceType === 'desktop' ? 24 : deviceType === 'tablet' ? 20 : 16;
  const componentSpacing = deviceType === 'desktop' ? 24 : deviceType === 'tablet' ? 20 : 16;

  const titleSize = deviceType === 'desktop' ? 30 : deviceType === 'tablet' ? 27 : 24;
  const cardTitleSize = deviceType === 'desktop' ? 18 : deviceType === 'tablet' ? 17 : 16;
  const bodySize = deviceType === 'desktop' ? 15 : deviceType === 'tablet' ? 14.5 : 14;
  const smallSize = deviceType === 'desktop' ? 13 : deviceType === 'tablet' ? 12.5 : 12;

  const availableGridWidth = Math.min(
    width - horizontalPadding * 2 - cardPadding * 2,
    maxContentWidth - horizontalPadding * 2 - cardPadding * 2
  );
  const rawColumns = Math.floor(
    (availableGridWidth + LAYOUT.defaultGridGap) / (LAYOUT.minGridItemWidth + LAYOUT.defaultGridGap)
  );

  const gridColumns = (() => {
    if (deviceType === 'desktop') return clampColumns(rawColumns, 4, 5);
    if (deviceType === 'tablet') return clampColumns(rawColumns, 3, 4);
    if (width >= 390) return clampColumns(rawColumns, 3, 4);
    return clampColumns(rawColumns, 2, 3);
  })();

  const gridGap = deviceType === 'desktop' ? 10 : 8;
  const gridItemWidth = (availableGridWidth - gridGap * (gridColumns - 1)) / gridColumns;

  return {
    width,
    height,
    deviceType,
    isLandscape,
    padding: {
      horizontal: horizontalPadding,
      vertical: verticalPadding,
      card: cardPadding,
    },
    fontSize: {
      title: titleSize,
      cardTitle: cardTitleSize,
      body: bodySize,
      small: smallSize,
    },
    spacing: {
      cardGap,
      component: componentSpacing,
    },
    borderRadius: {
      card: deviceType === 'desktop' ? 16 : deviceType === 'tablet' ? 14 : 12,
      large: deviceType === 'desktop' ? 24 : deviceType === 'tablet' ? 20 : 16,
    },
    layout: {
      maxContentWidth,
      gridColumns,
      gridItemWidth,
      gridGap,
    },
  };
}
