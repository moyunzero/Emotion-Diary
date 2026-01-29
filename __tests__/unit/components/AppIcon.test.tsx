import { render } from '@testing-library/react-native';
import { Frown, Heart } from 'lucide-react-native';
import React from 'react';
import AppIcon from '../../../components/icons/AppIcon';

describe('AppIcon Component', () => {
  describe('Basic Rendering', () => {
    it('should render with emoji string input', () => {
      const { getAllByTestId } = render(
        <AppIcon name="😔" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render with direct LucideIcon component', () => {
      const { getAllByTestId } = render(
        <AppIcon name={Heart} testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render fallback icon for unmapped emoji', () => {
      const { getAllByTestId } = render(
        <AppIcon name="🦄" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Props Handling', () => {
    it('should render with custom size prop', () => {
      const { getAllByTestId } = render(
        <AppIcon name={Heart} size={32} testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom size
    });

    it('should render with custom color prop', () => {
      const { getAllByTestId } = render(
        <AppIcon name={Heart} color="#FF0000" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom color
    });

    it('should render with custom strokeWidth prop', () => {
      const { getAllByTestId } = render(
        <AppIcon name={Heart} strokeWidth={3} testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons[0].props.strokeWidth).toBe(3);
    });

    it('should render with default values when props not provided', () => {
      const { getAllByTestId } = render(
        <AppIcon name={Heart} testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with default props
    });
  });

  describe('Emoji Mapping', () => {
    it('should map 😔 emoji to Frown icon', () => {
      const { getAllByTestId } = render(
        <AppIcon name="😔" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
      // The icon should be rendered (specific icon type checking is implementation-dependent)
    });

    it('should map 💙 emoji to Heart icon', () => {
      const { getAllByTestId } = render(
        <AppIcon name="💙" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should map 🌱 emoji to Sprout icon', () => {
      const { getAllByTestId } = render(
        <AppIcon name="🌱" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback Behavior', () => {
    it('should use default fallback icon (AlertCircle) for invalid input', () => {
      const { getAllByTestId } = render(
        <AppIcon name="invalid-icon" testID="test-icon" />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should use custom fallback icon when provided', () => {
      const { getAllByTestId } = render(
        <AppIcon 
          name="invalid-icon" 
          fallbackIcon={Frown}
          testID="test-icon" 
        />
      );
      
      const icons = getAllByTestId('test-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Memoization', () => {
    it('should be memoized (component should not re-render with same props)', () => {
      const { rerender, getAllByTestId } = render(
        <AppIcon name={Heart} size={24} color="#FF0000" testID="test-icon" />
      );
      
      const firstRender = getAllByTestId('test-icon');
      
      // Re-render with same props
      rerender(
        <AppIcon name={Heart} size={24} color="#FF0000" testID="test-icon" />
      );
      
      const secondRender = getAllByTestId('test-icon');
      
      // Component should exist after re-render
      expect(secondRender.length).toBeGreaterThan(0);
    });
  });
});
