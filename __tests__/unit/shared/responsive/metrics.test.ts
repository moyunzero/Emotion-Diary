import {
  BREAKPOINTS,
  createResponsiveMetrics,
  getDeviceTypeBySize,
  isLandscapeBySize,
} from '../../../../shared/responsive';

describe('shared/responsive metrics', () => {
  it('classifies small screens as phone', () => {
    expect(getDeviceTypeBySize(BREAKPOINTS.small - 1, 812)).toBe('phone');
  });

  it('classifies tablet threshold with landscape ratio as tablet', () => {
    expect(getDeviceTypeBySize(BREAKPOINTS.large, 900)).toBe('tablet');
  });

  it('classifies xlarge width as desktop', () => {
    expect(getDeviceTypeBySize(BREAKPOINTS.xlarge, 1366)).toBe('desktop');
  });

  it('handles portrait and landscape input switches', () => {
    expect(isLandscapeBySize(844, 390)).toBe(true);
    expect(isLandscapeBySize(390, 844)).toBe(false);
  });

  it('returns stable metrics from width/height inputs', () => {
    const phoneMetrics = createResponsiveMetrics(390, 844);
    const tabletMetrics = createResponsiveMetrics(768, 1024);

    expect(phoneMetrics.deviceType).toBe('phone');
    expect(tabletMetrics.deviceType).toBe('tablet');
    expect(tabletMetrics.padding.horizontal).toBeGreaterThan(phoneMetrics.padding.horizontal);
  });
});
