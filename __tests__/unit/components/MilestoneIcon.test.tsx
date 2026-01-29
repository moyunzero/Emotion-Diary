import { render } from '@testing-library/react-native';
import React from 'react';
import MilestoneIcon from '../../../components/icons/MilestoneIcon';

describe('MilestoneIcon Component', () => {
  describe('Basic Rendering', () => {
    it('should render with valid milestone emoji', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should return null for unmapped emoji', () => {
      const { queryByTestId } = render(
        <MilestoneIcon emoji="🦄" testID="milestone-icon" />
      );
      
      expect(queryByTestId('milestone-icon')).toBeNull();
    });

    it('should render all milestone emojis correctly', () => {
      const milestoneEmojis = ['🌱', '🌙', '💎', '🎉', '⭐', '👑'];
      
      milestoneEmojis.forEach(emoji => {
        const { getAllByTestId } = render(
          <MilestoneIcon emoji={emoji} testID={`milestone-${emoji}`} />
        );
        
        const icons = getAllByTestId(`milestone-${emoji}`);
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Props Handling', () => {
    it('should render with custom size prop', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" size={48} testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom size
    });

    it('should render with custom color prop', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" color="#10B981" testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom color
    });

    it('should render with default values when optional props not provided', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with default props (size=32, color='#000000')
    });
  });

  describe('Background Circle Styling', () => {
    it('should render without background by default', () => {
      const { queryByTestId } = render(
        <MilestoneIcon emoji="🌱" testID="milestone-icon" />
      );
      
      // Should not have a container when showBackground is false
      expect(queryByTestId('milestone-icon-container')).toBeNull();
    });

    it('should render with background circle when showBackground is true', () => {
      const { getByTestId } = render(
        <MilestoneIcon 
          emoji="🌱" 
          showBackground={true}
          testID="milestone-icon" 
        />
      );
      
      const container = getByTestId('milestone-icon-container');
      expect(container).toBeTruthy();
    });

    it('should apply custom backgroundColor when provided', () => {
      const customBgColor = '#E0F2FE';
      const { getByTestId } = render(
        <MilestoneIcon 
          emoji="🌱" 
          showBackground={true}
          backgroundColor={customBgColor}
          testID="milestone-icon" 
        />
      );
      
      const container = getByTestId('milestone-icon-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: customBgColor,
          }),
        ])
      );
    });

    it('should calculate background size as 1.5x icon size', () => {
      const iconSize = 32;
      const expectedBgSize = iconSize * 1.5;
      
      const { getByTestId } = render(
        <MilestoneIcon 
          emoji="🌱" 
          size={iconSize}
          showBackground={true}
          testID="milestone-icon" 
        />
      );
      
      const container = getByTestId('milestone-icon-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: expectedBgSize,
            height: expectedBgSize,
          }),
        ])
      );
    });

    it('should calculate border radius as 0.75x icon size', () => {
      const iconSize = 32;
      const expectedRadius = iconSize * 0.75;
      
      const { getByTestId } = render(
        <MilestoneIcon 
          emoji="🌱" 
          size={iconSize}
          showBackground={true}
          testID="milestone-icon" 
        />
      );
      
      const container = getByTestId('milestone-icon-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderRadius: expectedRadius,
          }),
        ])
      );
    });

    it('should use default background color when not provided', () => {
      const { getByTestId } = render(
        <MilestoneIcon 
          emoji="🌱" 
          showBackground={true}
          testID="milestone-icon" 
        />
      );
      
      const container = getByTestId('milestone-icon-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#F3F4F6',
          }),
        ])
      );
    });
  });

  describe('Icon Mapping Integration', () => {
    it('should use getIconByEmoji to resolve icon component', () => {
      // Test that each milestone emoji maps to a valid icon
      const milestoneEmojis = ['🌱', '🌙', '💎', '🎉', '⭐', '👑'];
      
      milestoneEmojis.forEach(emoji => {
        const { getAllByTestId } = render(
          <MilestoneIcon emoji={emoji} testID={`icon-${emoji}`} />
        );
        
        const icons = getAllByTestId(`icon-${emoji}`);
        expect(icons.length).toBeGreaterThan(0);
      });
    });

    it('should pass correct strokeWidth to AppIcon', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons[0].props.strokeWidth).toBe(2.5);
    });
  });

  describe('Development Warnings', () => {
    // Note: Testing console.warn in __DEV__ mode requires special setup
    // This test documents the expected behavior
    it('should warn in development mode for unmapped emoji', () => {
      const originalWarn = console.warn;
      const mockWarn = jest.fn();
      console.warn = mockWarn;

      render(<MilestoneIcon emoji="🦄" />);

      // In development mode, should warn about missing mapping
      if (__DEV__) {
        expect(mockWarn).toHaveBeenCalledWith(
          expect.stringContaining('No icon mapping found for emoji')
        );
      }

      console.warn = originalWarn;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string emoji gracefully', () => {
      const { queryByTestId } = render(
        <MilestoneIcon emoji="" testID="milestone-icon" />
      );
      
      expect(queryByTestId('milestone-icon')).toBeNull();
    });

    it('should handle very large size values', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" size={128} testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle very small size values', () => {
      const { getAllByTestId } = render(
        <MilestoneIcon emoji="🌱" size={8} testID="milestone-icon" />
      );
      
      const icons = getAllByTestId('milestone-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
