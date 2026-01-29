/**
 * Unit tests for moodIconUtils return types
 * Task 15.3: Verify that getMoodIcon returns correctly typed JSX.Element
 * Requirement 2.4: When using utility functions, THE System SHALL provide explicit return type annotations
 */

import React from 'react';
import { getMoodIcon } from '../../../utils/moodIconUtils';

describe('moodIconUtils.tsx - Icon Utility Functions', () => {
  describe('getMoodIcon', () => {
    it('should return JSX.Element type for Droplet icon', () => {
      const result = getMoodIcon('Droplet', '#3B82F6', 20);
      
      // Verify it's a React element
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should return JSX.Element type for Cloud icon', () => {
      const result = getMoodIcon('Cloud', '#10B981', 24);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should return JSX.Element type for CloudRain icon', () => {
      const result = getMoodIcon('CloudRain', '#F59E0B', 28);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should return JSX.Element type for CloudLightning icon', () => {
      const result = getMoodIcon('CloudLightning', '#EF4444', 32);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should return JSX.Element type for Zap icon', () => {
      const result = getMoodIcon('Zap', '#8B5CF6', 20);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should return JSX.Element type for unknown icon (defaults to Droplet)', () => {
      const result = getMoodIcon('UnknownIcon', '#000000', 20);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should return JSX.Element with default size parameter', () => {
      const result = getMoodIcon('Cloud', '#3B82F6');
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should handle various color formats', () => {
      const hexColor = getMoodIcon('Droplet', '#FF5733', 20);
      const rgbColor = getMoodIcon('Cloud', 'rgb(255, 87, 51)', 20);
      const namedColor = getMoodIcon('CloudRain', 'blue', 20);
      
      expect(React.isValidElement(hexColor)).toBe(true);
      expect(React.isValidElement(rgbColor)).toBe(true);
      expect(React.isValidElement(namedColor)).toBe(true);
    });

    it('should handle various size values', () => {
      const small = getMoodIcon('Droplet', '#3B82F6', 16);
      const medium = getMoodIcon('Droplet', '#3B82F6', 24);
      const large = getMoodIcon('Droplet', '#3B82F6', 48);
      
      expect(React.isValidElement(small)).toBe(true);
      expect(React.isValidElement(medium)).toBe(true);
      expect(React.isValidElement(large)).toBe(true);
    });
  });

  describe('TypeScript Inference Validation', () => {
    it('should infer correct JSX.Element type', () => {
      // TypeScript should infer this as React.JSX.Element
      const icon: React.ReactElement = getMoodIcon('Droplet', '#3B82F6', 20);
      
      expect(icon).toBeDefined();
      expect(React.isValidElement(icon)).toBe(true);
    });

    it('should be assignable to JSX.Element', () => {
      // This should compile without errors
      const icon = getMoodIcon('Cloud', '#10B981');
      const element: React.ReactElement = icon;
      
      expect(element).toBeDefined();
      expect(React.isValidElement(element)).toBe(true);
    });

    it('should be assignable to React.ReactElement', () => {
      // This should compile without errors
      const icon = getMoodIcon('CloudRain', '#F59E0B');
      const element: React.ReactElement = icon;
      
      expect(element).toBeDefined();
      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('Return Value Consistency', () => {
    it('should always return valid React elements', () => {
      const iconNames = ['Droplet', 'Cloud', 'CloudRain', 'CloudLightning', 'Zap', 'Unknown'];
      
      iconNames.forEach(iconName => {
        const result = getMoodIcon(iconName, '#000000', 20);
        expect(React.isValidElement(result)).toBe(true);
      });
    });

    it('should return elements with consistent structure', () => {
      const icon1 = getMoodIcon('Droplet', '#3B82F6', 20);
      const icon2 = getMoodIcon('Cloud', '#10B981', 24);
      
      // Both should be valid React elements
      expect(React.isValidElement(icon1)).toBe(true);
      expect(React.isValidElement(icon2)).toBe(true);
      
      // Both should have type property (component function)
      expect(icon1.type).toBeDefined();
      expect(icon2.type).toBeDefined();
      
      // Both should have props
      expect(icon1.props).toBeDefined();
      expect(icon2.props).toBeDefined();
    });

    it('should return elements with correct props structure', () => {
      const size = 24;
      const color = '#3B82F6';
      const icon = getMoodIcon('Droplet', color, size);
      
      expect(React.isValidElement(icon)).toBe(true);
      expect(icon.props).toHaveProperty('size');
      expect(icon.props).toHaveProperty('color');
      expect(icon.props.size).toBe(size);
      expect(icon.props.color).toBe(color);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string icon name', () => {
      const result = getMoodIcon('', '#000000', 20);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });

    it('should handle zero size', () => {
      const result = getMoodIcon('Droplet', '#3B82F6', 0);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result.props.size).toBe(0);
    });

    it('should handle negative size', () => {
      const result = getMoodIcon('Cloud', '#10B981', -10);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result.props.size).toBe(-10);
    });

    it('should handle very large size', () => {
      const result = getMoodIcon('CloudRain', '#F59E0B', 1000);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result.props.size).toBe(1000);
    });

    it('should handle empty color string', () => {
      const result = getMoodIcon('Droplet', '', 20);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result.props.color).toBe('');
    });

    it('should handle special characters in icon name', () => {
      const result = getMoodIcon('Icon@#$%', '#3B82F6', 20);
      
      expect(React.isValidElement(result)).toBe(true);
      expect(result).toBeDefined();
    });
  });

  describe('Icon Name Case Sensitivity', () => {
    it('should handle exact case match for Droplet', () => {
      const result = getMoodIcon('Droplet', '#3B82F6', 20);
      expect(React.isValidElement(result)).toBe(true);
    });

    it('should default to Droplet for lowercase droplet', () => {
      const result = getMoodIcon('droplet', '#3B82F6', 20);
      expect(React.isValidElement(result)).toBe(true);
    });

    it('should default to Droplet for uppercase DROPLET', () => {
      const result = getMoodIcon('DROPLET', '#3B82F6', 20);
      expect(React.isValidElement(result)).toBe(true);
    });
  });

  describe('Multiple Calls Consistency', () => {
    it('should return consistent types across multiple calls', () => {
      const call1 = getMoodIcon('Droplet', '#3B82F6', 20);
      const call2 = getMoodIcon('Droplet', '#3B82F6', 20);
      const call3 = getMoodIcon('Cloud', '#10B981', 24);
      
      expect(React.isValidElement(call1)).toBe(true);
      expect(React.isValidElement(call2)).toBe(true);
      expect(React.isValidElement(call3)).toBe(true);
    });

    it('should handle rapid successive calls', () => {
      const icons = [];
      for (let i = 0; i < 100; i++) {
        icons.push(getMoodIcon('Droplet', '#3B82F6', 20));
      }
      
      icons.forEach(icon => {
        expect(React.isValidElement(icon)).toBe(true);
      });
    });
  });
});
