/**
 * Property-Based Tests for Responsive Design
 * 
 * Feature: react-native-optimization
 * Property 6: Responsive design scales with screen dimensions
 * 
 * Validates: Requirements 7.1, 7.3
 * 
 * These tests use fast-check to verify that:
 * 1. Dimensions scale proportionally with screen width
 * 2. Components re-render when screen dimensions change
 * 3. Responsive calculations are accurate across different screen sizes
 */

import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { calculateResponsiveDimension } from '../../styles/constants';

describe('Feature: react-native-optimization, Property 6: Responsive design scales with screen dimensions', () => {
  /**
   * Test that dimensions scale proportionally with screen width
   * For any screen width and percentage, the calculated dimension should be
   * within 1 pixel of the expected value (accounting for rounding)
   */
  it('should scale dimensions proportionally with screen width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }), // Screen widths from mobile to desktop
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }), // Percentage (10% to 90%)
        (screenWidth, percentage) => {
          const expectedDimension = screenWidth * percentage;
          const calculatedDimension = calculateResponsiveDimension(screenWidth, percentage);
          
          // Should be within 1 pixel due to rounding
          const difference = Math.abs(calculatedDimension - expectedDimension);
          expect(difference).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that calculateResponsiveDimension returns integers
   * Responsive dimensions should always be whole numbers for pixel-perfect rendering
   */
  it('should return integer values for responsive dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(1.0), noNaN: true }),
        (screenWidth, percentage) => {
          const dimension = calculateResponsiveDimension(screenWidth, percentage);
          
          // Should be an integer
          expect(Number.isInteger(dimension)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that responsive dimensions scale linearly
   * If screen width doubles, the responsive dimension should also double (within rounding)
   */
  it('should scale linearly with screen width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 960 }), // Base width (max 960 so doubled is within range)
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
        (baseWidth, percentage) => {
          const doubledWidth = baseWidth * 2;
          
          const baseDimension = calculateResponsiveDimension(baseWidth, percentage);
          const doubledDimension = calculateResponsiveDimension(doubledWidth, percentage);
          
          // Doubled dimension should be approximately twice the base dimension
          // Allow for rounding differences (within 2 pixels)
          const expectedDoubled = baseDimension * 2;
          const difference = Math.abs(doubledDimension - expectedDoubled);
          expect(difference).toBeLessThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that responsive dimensions are consistent
   * Calling the function multiple times with the same inputs should return the same result
   */
  it('should return consistent results for the same inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
        (screenWidth, percentage) => {
          const result1 = calculateResponsiveDimension(screenWidth, percentage);
          const result2 = calculateResponsiveDimension(screenWidth, percentage);
          const result3 = calculateResponsiveDimension(screenWidth, percentage);
          
          // All results should be identical
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that components using useMemo for responsive dimensions
   * maintain referential equality when screen width doesn't change
   */
  it('should maintain referential equality for memoized responsive dimensions when screen width unchanged', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
        fc.integer({ min: 1, max: 5 }), // Number of re-renders
        (screenWidth, percentage, numRerenders) => {
          const dimensionRefs: number[] = [];

          const TestComponent: React.FC<{ width: number; pct: number; unrelated: number }> = ({ 
            width, 
            pct, 
            unrelated 
          }) => {
            const responsiveDimension = useMemo(
              () => calculateResponsiveDimension(width, pct),
              [width, pct]
            );

            dimensionRefs.push(responsiveDimension);

            return (
              <View style={{ width: responsiveDimension }}>
                <Text>{unrelated}</Text>
              </View>
            );
          };

          const { rerender } = render(
            <TestComponent width={screenWidth} pct={percentage} unrelated={0} />
          );

          // Re-render with same width/percentage but different unrelated value
          for (let i = 0; i < numRerenders; i++) {
            rerender(
              <TestComponent width={screenWidth} pct={percentage} unrelated={i + 1} />
            );
          }

          // All dimension values should be the same
          for (let i = 1; i < dimensionRefs.length; i++) {
            expect(dimensionRefs[i]).toBe(dimensionRefs[0]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that components recalculate responsive dimensions when screen width changes
   */
  it('should recalculate dimensions when screen width changes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.integer({ min: 320, max: 1920 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
        (width1, width2, percentage) => {
          fc.pre(Math.abs(width1 - width2) > 10); // Significant change

          const dimensionRefs: number[] = [];

          const TestComponent: React.FC<{ width: number; pct: number }> = ({ width, pct }) => {
            const responsiveDimension = useMemo(
              () => calculateResponsiveDimension(width, pct),
              [width, pct]
            );

            dimensionRefs.push(responsiveDimension);

            return (
              <View style={{ width: responsiveDimension }}>
                <Text>Test</Text>
              </View>
            );
          };

          const { rerender } = render(
            <TestComponent width={width1} pct={percentage} />
          );

          rerender(
            <TestComponent width={width2} pct={percentage} />
          );

          // Dimensions should be different when width changes
          expect(dimensionRefs[0]).not.toBe(dimensionRefs[1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that responsive dimensions handle edge cases correctly
   */
  it('should handle edge cases correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (screenWidth) => {
          // 0% should give 0
          expect(calculateResponsiveDimension(screenWidth, 0)).toBe(0);
          
          // 100% should give screen width (rounded)
          const fullWidth = calculateResponsiveDimension(screenWidth, 1.0);
          expect(Math.abs(fullWidth - screenWidth)).toBeLessThanOrEqual(1);
          
          // 50% should give approximately half
          const halfWidth = calculateResponsiveDimension(screenWidth, 0.5);
          expect(Math.abs(halfWidth - screenWidth / 2)).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that multiple responsive dimensions maintain correct proportions
   */
  it('should maintain correct proportions between multiple responsive dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.4), noNaN: true }), // Smaller percentage
        fc.float({ min: Math.fround(0.5), max: Math.fround(0.9), noNaN: true }), // Larger percentage
        (screenWidth, smallPct, largePct) => {
          fc.pre(largePct > smallPct); // Ensure large is actually larger

          const smallDimension = calculateResponsiveDimension(screenWidth, smallPct);
          const largeDimension = calculateResponsiveDimension(screenWidth, largePct);
          
          // Larger percentage should give larger dimension
          expect(largeDimension).toBeGreaterThan(smallDimension);
          
          // Ratio should be approximately correct (within rounding)
          const expectedRatio = largePct / smallPct;
          const actualRatio = largeDimension / smallDimension;
          const ratioDifference = Math.abs(actualRatio - expectedRatio);
          
          // Allow for some rounding error (5% tolerance)
          expect(ratioDifference).toBeLessThan(expectedRatio * 0.05);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that responsive dimensions work correctly across common device sizes
   */
  it('should work correctly for common device sizes', () => {
    const commonDeviceSizes = [
      { name: 'iPhone SE', width: 375 },
      { name: 'iPhone 12', width: 390 },
      { name: 'iPhone 12 Pro Max', width: 428 },
      { name: 'iPad', width: 768 },
      { name: 'iPad Pro', width: 1024 },
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...commonDeviceSizes),
        fc.float({ min: Math.fround(0.1), max: Math.fround(0.9), noNaN: true }),
        (device, percentage) => {
          const dimension = calculateResponsiveDimension(device.width, percentage);
          
          // Should be a valid dimension
          expect(dimension).toBeGreaterThan(0);
          expect(dimension).toBeLessThanOrEqual(device.width);
          expect(Number.isInteger(dimension)).toBe(true);
          
          // Should be proportional to screen width
          const expectedDimension = device.width * percentage;
          const difference = Math.abs(dimension - expectedDimension);
          expect(difference).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that responsive dimensions are never negative
   */
  it('should never return negative dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        fc.float({ min: Math.fround(0), max: Math.fround(1.0), noNaN: true }),
        (screenWidth, percentage) => {
          const dimension = calculateResponsiveDimension(screenWidth, percentage);
          
          // Should never be negative
          expect(dimension).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
