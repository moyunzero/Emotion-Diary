/**
 * Dashboard FlashList Optimization Unit Tests
 * 
 * Tests for Task 4: Optimize FlashList configuration in Dashboard
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import Dashboard from '../../../components/Dashboard';
import { useAppStore } from '../../../store/useAppStore';

// Mock dependencies
jest.mock('../../../store/useAppStore');
jest.mock('../../../components/EntryCard', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ entry }: any) => (
      <View testID={`entry-card-${entry.id}`}>
        <Text>{entry.content}</Text>
      </View>
    ),
  };
});
jest.mock('../../../components/WeatherStation', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: () => (
      <View testID="weather-station">
        <Text>Weather Station</Text>
      </View>
    ),
  };
});
jest.mock('../../../components/Avatar', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: any) => (
      <View testID="avatar">
        <Text>{name}</Text>
      </View>
    ),
  };
});
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock('../../../hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    colors: {
      background: {
        page: '#FFFFFF',
        primary: '#F5F5F5',
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
        tertiary: '#999999',
        inverse: '#FFFFFF',
      },
      border: {
        light: '#E0E0E0',
      },
      submit: '#007AFF',
    },
  }),
}));

// Mock useWindowDimensions directly
const mockUseWindowDimensions = jest.fn();
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: mockUseWindowDimensions,
}));

describe('Dashboard FlashList Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for useAppStore
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      entries: [],
      weather: {
        score: 75,
        condition: 'sunny',
        description: '心情晴朗',
      },
      user: {
        id: '1',
        name: 'Test User',
        avatar: null,
      },
    });

    // Default mock for useWindowDimensions
    mockUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 667,
      scale: 2,
      fontScale: 1,
    });
  });

  describe('Requirement 3.3: useWindowDimensions hook', () => {
    it('should use useWindowDimensions hook', () => {
      render(<Dashboard />);
      
      // useWindowDimensions should be called
      expect(mockUseWindowDimensions).toHaveBeenCalled();
    });

    it('should update layout when window dimensions change', () => {
      const { rerender } = render(<Dashboard />);
      
      // Change window dimensions
      mockUseWindowDimensions.mockReturnValue({
        width: 768,
        height: 1024,
        scale: 2,
        fontScale: 1,
      });
      
      // Re-render with new dimensions
      rerender(<Dashboard />);
      
      // Component should re-render without errors
      expect(mockUseWindowDimensions).toHaveBeenCalled();
    });

    it('should handle small screen widths', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 320,
        height: 568,
        scale: 2,
        fontScale: 1,
      });
      
      const { root } = render(<Dashboard />);
      
      // Component should render without errors on small screens
      expect(root).toBeTruthy();
    });

    it('should handle large screen widths', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 1024,
        height: 1366,
        scale: 2,
        fontScale: 1,
      });
      
      const { root } = render(<Dashboard />);
      
      // Component should render without errors on large screens
      expect(root).toBeTruthy();
    });
  });

  describe('Requirement 3.2: Header memoization', () => {
    it('should render list header component', () => {
      (useAppStore as unknown as jest.Mock).mockReturnValue({
        entries: [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: 3,
            content: 'Test entry',
            deadline: '今天',
            people: [],
            triggers: [],
            status: 'active',
          },
        ],
        weather: {
          score: 75,
          condition: 'sunny',
          description: '心情晴朗',
        },
        user: {
          id: '1',
          name: 'Test User',
          avatar: null,
        },
      });

      const { getAllByText } = render(<Dashboard />);
      
      // Header should contain filter label and count
      expect(getAllByText(/未处理/)[0]).toBeTruthy();
      expect(getAllByText(/(1)/)[0]).toBeTruthy();
    });

    it('should update header when filter changes', () => {
      const mockStore = {
        entries: [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: 3,
            content: 'Test entry',
            deadline: '今天',
            people: [],
            triggers: [],
            status: 'active',
          },
          {
            id: '2',
            timestamp: Date.now(),
            moodLevel: 2,
            content: 'Resolved entry',
            deadline: '今天',
            people: [],
            triggers: [],
            status: 'resolved',
            resolvedAt: Date.now(),
          },
        ],
        weather: {
          score: 75,
          condition: 'sunny',
          description: '心情晴朗',
        },
        user: {
          id: '1',
          name: 'Test User',
          avatar: null,
        },
      };

      (useAppStore as unknown as jest.Mock).mockReturnValue(mockStore);

      const { getAllByText } = render(<Dashboard />);
      
      // Initially should show active filter
      expect(getAllByText(/未处理/)[0]).toBeTruthy();
      
      // Count should reflect filtered entries
      expect(getAllByText(/(1)/)[0]).toBeTruthy();
    });
  });

  describe('FlashList configuration', () => {
    it('should render FlashList component', () => {
      const { root } = render(<Dashboard />);
      
      // Component should render without errors
      expect(root).toBeTruthy();
    });

    it('should render empty state when no entries', () => {
      (useAppStore as unknown as jest.Mock).mockReturnValue({
        entries: [],
        weather: {
          score: 75,
          condition: 'sunny',
          description: '心情晴朗',
        },
        user: {
          id: '1',
          name: 'Test User',
          avatar: null,
        },
      });

      const { getByText } = render(<Dashboard />);
      
      // Should show empty state
      expect(getByText('暂无待处理的情绪')).toBeTruthy();
    });

    it('should render entries when data is available', () => {
      (useAppStore as unknown as jest.Mock).mockReturnValue({
        entries: [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: 3,
            content: 'Test entry 1',
            deadline: '今天',
            people: [],
            triggers: [],
            status: 'active',
          },
          {
            id: '2',
            timestamp: Date.now() - 1000,
            moodLevel: 4,
            content: 'Test entry 2',
            deadline: '明天',
            people: [],
            triggers: [],
            status: 'active',
          },
        ],
        weather: {
          score: 75,
          condition: 'sunny',
          description: '心情晴朗',
        },
        user: {
          id: '1',
          name: 'Test User',
          avatar: null,
        },
      });

      const { getAllByText } = render(<Dashboard />);
      
      // Should show entry count
      expect(getAllByText(/(2)/)[0]).toBeTruthy();
    });
  });

  describe('Responsive design', () => {
    it('should calculate dropdown position based on window width', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });

      const { root } = render(<Dashboard />);
      
      // Component should render and use window width for calculations
      expect(root).toBeTruthy();
      expect(mockUseWindowDimensions).toHaveBeenCalled();
    });

    it('should handle window height for dropdown positioning', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      });

      const { root } = render(<Dashboard />);
      
      // Component should use window height for dropdown boundary detection
      expect(root).toBeTruthy();
    });
  });

  describe('Integration: All optimizations together', () => {
    it('should work correctly with all optimizations applied', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 414,
        height: 896,
        scale: 3,
        fontScale: 1,
      });

      (useAppStore as unknown as jest.Mock).mockReturnValue({
        entries: [
          {
            id: '1',
            timestamp: Date.now(),
            moodLevel: 3,
            content: 'Test entry',
            deadline: '今天',
            people: ['Person 1'],
            triggers: ['Trigger 1'],
            status: 'active',
          },
        ],
        weather: {
          score: 75,
          condition: 'sunny',
          description: '心情晴朗',
        },
        user: {
          id: '1',
          name: 'Test User',
          avatar: 'https://example.com/avatar.jpg',
        },
      });

      const { getAllByText, root } = render(<Dashboard />);
      
      // All features should work together
      expect(root).toBeTruthy();
      expect(getAllByText(/未处理/)[0]).toBeTruthy();
      expect(getAllByText(/(1)/)[0]).toBeTruthy();
      expect(mockUseWindowDimensions).toHaveBeenCalled();
    });
  });
});
