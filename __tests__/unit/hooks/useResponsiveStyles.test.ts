import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useWindowDimensions } from 'react-native';

import { createResponsiveMetrics } from '../../../shared/responsive';
import { useResponsiveStyles } from '../../../hooks/useResponsiveStyles';

jest.mock('react-native', () => {
  return {
    useWindowDimensions: jest.fn(),
  };
});

const mockUseWindowDimensions = useWindowDimensions as jest.Mock;

describe('hooks/useResponsiveStyles', () => {
  let latestStyles: ReturnType<typeof useResponsiveStyles> | null = null;

  const Probe = () => {
    latestStyles = useResponsiveStyles();
    return null;
  };

  beforeEach(() => {
    latestStyles = null;
    mockUseWindowDimensions.mockReset();
  });

  it('maps styles from shared responsive metrics', () => {
    mockUseWindowDimensions.mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
    act(() => {
      TestRenderer.create(React.createElement(Probe));
    });
    const metrics = createResponsiveMetrics(390, 844);

    expect(latestStyles?.padding.horizontal).toBe(metrics.padding.horizontal);
    expect(latestStyles?.fontSize.title).toBe(metrics.fontSize.title);
    expect(latestStyles?.layout.gridColumns).toBe(metrics.layout.gridColumns);
  });

  it('updates styles when screen dimensions change', () => {
    mockUseWindowDimensions
      .mockReturnValueOnce({ width: 390, height: 844, scale: 3, fontScale: 1 })
      .mockReturnValueOnce({ width: 844, height: 390, scale: 3, fontScale: 1 });

    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(React.createElement(Probe));
    });
    const first = latestStyles?.layout.gridColumns;

    act(() => {
      renderer!.update(React.createElement(Probe));
    });
    const second = latestStyles?.layout.gridColumns;

    expect(first).not.toBe(second);
  });
});
