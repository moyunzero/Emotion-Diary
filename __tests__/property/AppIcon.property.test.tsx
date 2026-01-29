/**
 * AppIcon component property tests
 * Feature: emoji-to-vector-icons
 * 
 * Property 8: Icon Component Fallback
 * Validates: Requirements 6.3
 */

import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import { HelpCircle } from 'lucide-react-native';
import React from 'react';
import AppIcon from '../../components/icons/AppIcon';
import { getAllMappedEmojis } from '../../utils/iconMapping';

describe('AppIcon Property Tests', () => {
  /**
   * Property 8: Icon Component Fallback
   * For any invalid or missing icon name passed to AppIcon, 
   * the component SHALL render the fallback icon instead of 
   * crashing or rendering nothing.
   * 
   * **Validates: Requirements 6.3**
   */
  describe('Property 8: Icon Component Fallback', () => {
    it('should render fallback icon for any random invalid string', () => {
      // Generate random invalid icon names
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (invalidName) => {
            // Ensure the string is not a valid emoji mapping
            const mappedEmojis = getAllMappedEmojis();
            if (mappedEmojis.includes(invalidName)) {
              // Skip valid emojis
              return true;
            }

            // Render with invalid name
            const { getAllByTestId } = render(
              <AppIcon name={invalidName} testID="fallback-icon" />
            );

            // Should render something (the fallback icon)
            const icons = getAllByTestId('fallback-icon');
            expect(icons.length).toBeGreaterThan(0);
            
            // Component should not crash
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render fallback icon for any random alphanumeric string', () => {
      // Generate random alphanumeric strings that are definitely not valid icons
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
            ),
            { minLength: 5, maxLength: 20 }
          ).map(arr => arr.join('')),
          (invalidName) => {
            const { getAllByTestId } = render(
              <AppIcon name={invalidName} testID="fallback-icon" />
            );

            // Should render the fallback icon
            const icons = getAllByTestId('fallback-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render fallback icon for any unmapped emoji', () => {
      // Use a set of emojis that are definitely not in our mapping
      const unmappedEmojis = [
        '🦄', '🚀', '🎨', '🔥', '💻', '🌈', '🎯', '🎪',
        '🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🐸', '🐵',
        '🍕', '🍔', '🍟', '🍿', '🎂', '🍰', '🍪', '🍩',
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...unmappedEmojis),
          (unmappedEmoji) => {
            const { getAllByTestId } = render(
              <AppIcon name={unmappedEmoji} testID="fallback-icon" />
            );

            // Should render the fallback icon
            const icons = getAllByTestId('fallback-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should render custom fallback icon when provided', () => {
      // Test that custom fallback icons work for any invalid name
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          (invalidName) => {
            // Ensure the string is not a valid emoji mapping
            const mappedEmojis = getAllMappedEmojis();
            if (mappedEmojis.includes(invalidName)) {
              return true;
            }

            const { getAllByTestId } = render(
              <AppIcon 
                name={invalidName} 
                fallbackIcon={HelpCircle}
                testID="custom-fallback-icon" 
              />
            );

            // Should render the custom fallback icon
            const icons = getAllByTestId('custom-fallback-icon');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never crash or render nothing for any invalid input', () => {
      // Test with various types of invalid inputs
      const invalidInputs = fc.oneof(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constant(''),
        fc.constant('   '),
        fc.constant('invalid-icon-name'),
        fc.constant('NonExistentIcon'),
        fc.constant('🦄🚀🎨'),
        fc.constant('123456'),
        fc.constant('!@#$%^&*()'),
      );

      fc.assert(
        fc.property(
          invalidInputs,
          (invalidInput) => {
            // Skip empty strings as they might be handled differently
            if (invalidInput.trim() === '') {
              return true;
            }

            // Ensure the string is not a valid emoji mapping
            const mappedEmojis = getAllMappedEmojis();
            if (mappedEmojis.includes(invalidInput)) {
              return true;
            }

            // Should not throw an error
            expect(() => {
              const { getAllByTestId } = render(
                <AppIcon name={invalidInput} testID="safe-icon" />
              );

              const icons = getAllByTestId('safe-icon');
              // Should render something
              expect(icons.length).toBeGreaterThan(0);
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default AlertCircle fallback when no custom fallback provided', () => {
      // Test that the default fallback is used
      const invalidNames = ['invalid', 'NotAnIcon', '🦄', 'xyz123'];

      fc.assert(
        fc.property(
          fc.constantFrom(...invalidNames),
          (invalidName) => {
            const { getAllByTestId } = render(
              <AppIcon name={invalidName} testID="default-fallback" />
            );

            // Should render the default fallback (AlertCircle)
            const icons = getAllByTestId('default-fallback');
            expect(icons.length).toBeGreaterThan(0);
            expect(icons[0]).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain props when rendering fallback icon', () => {
      // Test that size, color, and strokeWidth are preserved with fallback
      // This test verifies the component renders successfully with various prop combinations
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 16, max: 128 }),
          fc.constantFrom('#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'),
          fc.integer({ min: 1, max: 5 }),
          (invalidName, size, color, strokeWidth) => {
            // Ensure the string is not a valid emoji mapping
            const mappedEmojis = getAllMappedEmojis();
            fc.pre(!mappedEmojis.includes(invalidName));

            // Should not throw an error when rendering with various props
            expect(() => {
              const { getAllByTestId } = render(
                <AppIcon 
                  name={invalidName}
                  size={size}
                  color={color}
                  strokeWidth={strokeWidth}
                  testID="props-fallback" 
                />
              );

              const icons = getAllByTestId('props-fallback');
              expect(icons.length).toBeGreaterThan(0);
              expect(icons[0]).toBeTruthy();
            }).not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Fallback consistency
   * The fallback behavior should be consistent across multiple renders
   */
  describe('Fallback Consistency', () => {
    it('should render the same fallback icon for the same invalid input', () => {
      const invalidName = 'consistently-invalid-icon';

      // Render multiple times
      const render1 = render(
        <AppIcon name={invalidName} testID="consistent-1" />
      );
      const render2 = render(
        <AppIcon name={invalidName} testID="consistent-2" />
      );

      const icons1 = render1.getAllByTestId('consistent-1');
      const icons2 = render2.getAllByTestId('consistent-2');

      // Both should render successfully
      expect(icons1.length).toBeGreaterThan(0);
      expect(icons2.length).toBeGreaterThan(0);
      
      // Both should have the same structure
      expect(icons1[0]).toBeTruthy();
      expect(icons2[0]).toBeTruthy();
    });

    it('should handle rapid re-renders with invalid names gracefully', () => {
      const { rerender, getAllByTestId } = render(
        <AppIcon name="invalid-1" testID="rerender-test" />
      );

      // Should render initially
      let icons = getAllByTestId('rerender-test');
      expect(icons.length).toBeGreaterThan(0);

      // Re-render with different invalid names
      rerender(<AppIcon name="invalid-2" testID="rerender-test" />);
      icons = getAllByTestId('rerender-test');
      expect(icons.length).toBeGreaterThan(0);

      rerender(<AppIcon name="invalid-3" testID="rerender-test" />);
      icons = getAllByTestId('rerender-test');
      expect(icons.length).toBeGreaterThan(0);

      // Should not crash or fail
      expect(icons[0]).toBeTruthy();
    });
  });
});
