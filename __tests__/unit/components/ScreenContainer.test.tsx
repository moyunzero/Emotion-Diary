/**
 * ScreenContainer 组件单元测试
 * 
 * 测试 ScreenContainer 组件的以下功能：
 * - SafeAreaView 渲染和 edges 配置
 * - 键盘处理（keyboardAware）
 * - 滚动行为（scrollable）
 * - 样式传递
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import ScreenContainer from '../../../components/ScreenContainer';

// Mock hooks
jest.mock('../../../hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    colors: {
      background: {
        page: '#FFFFFF',
      },
    },
  }),
}));

describe('ScreenContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <ScreenContainer>
          <Text>Test Content</Text>
        </ScreenContainer>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('should render with default edges', () => {
      const { UNSAFE_getByType } = render(
        <ScreenContainer>
          <Text>Test</Text>
        </ScreenContainer>
      );

      // SafeAreaView should be rendered
      const safeAreaView = UNSAFE_getByType(
        require('react-native-safe-area-context').SafeAreaView
      );
      expect(safeAreaView).toBeTruthy();
      // Default edges should be ['top', 'left', 'right', 'bottom']
      expect(safeAreaView.props.edges).toEqual(['top', 'left', 'right', 'bottom']);
    });

    it('should render with custom edges', () => {
      const { UNSAFE_getByType } = render(
        <ScreenContainer edges={['top', 'left', 'right']}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const safeAreaView = UNSAFE_getByType(
        require('react-native-safe-area-context').SafeAreaView
      );
      expect(safeAreaView.props.edges).toEqual(['top', 'left', 'right']);
    });
  });

  describe('Scrollable Behavior', () => {
    it('should not render ScrollView when scrollable is false', () => {
      const { UNSAFE_queryByType } = render(
        <ScreenContainer scrollable={false}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const scrollView = UNSAFE_queryByType(
        require('react-native').ScrollView
      );
      expect(scrollView).toBeNull();
    });

    it('should render ScrollView when scrollable is true', () => {
      const { UNSAFE_getByType } = render(
        <ScreenContainer scrollable>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const scrollView = UNSAFE_getByType(
        require('react-native').ScrollView
      );
      expect(scrollView).toBeTruthy();
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
      expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
    });

    it('should pass contentContainerStyle to ScrollView', () => {
      const contentStyle = { padding: 20 };
      const { UNSAFE_getByType } = render(
        <ScreenContainer scrollable contentContainerStyle={contentStyle}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const scrollView = UNSAFE_getByType(
        require('react-native').ScrollView
      );
      expect(scrollView.props.contentContainerStyle).toEqual(contentStyle);
    });
  });

  describe('Keyboard Aware Behavior', () => {
    it('should not render KeyboardAvoidingView when keyboardAware is false', () => {
      const { UNSAFE_queryByType } = render(
        <ScreenContainer keyboardAware={false}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const keyboardAvoidingView = UNSAFE_queryByType(
        require('react-native').KeyboardAvoidingView
      );
      expect(keyboardAvoidingView).toBeNull();
    });

    it('should render KeyboardAvoidingView when keyboardAware is true', () => {
      const { UNSAFE_getByType } = render(
        <ScreenContainer keyboardAware>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const keyboardAvoidingView = UNSAFE_getByType(
        require('react-native').KeyboardAvoidingView
      );
      expect(keyboardAvoidingView).toBeTruthy();
      expect(keyboardAvoidingView.props.style).toEqual({ flex: 1 });
    });

    it('should configure KeyboardAvoidingView for iOS', () => {
      // Mock Platform.OS
      jest.mock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'ios',
        select: jest.fn((obj) => obj.ios),
      }));

      const { UNSAFE_getByType } = render(
        <ScreenContainer keyboardAware>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const keyboardAvoidingView = UNSAFE_getByType(
        require('react-native').KeyboardAvoidingView
      );
      // On iOS, behavior should be 'padding'
      expect(keyboardAvoidingView.props.behavior).toBe('padding');
    });
  });

  describe('Style Handling', () => {
    it('should apply custom style to SafeAreaView when not scrollable', () => {
      const customStyle = { backgroundColor: '#FF0000' };
      const { UNSAFE_getByType } = render(
        <ScreenContainer style={customStyle}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const safeAreaView = UNSAFE_getByType(
        require('react-native-safe-area-context').SafeAreaView
      );
      expect(safeAreaView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ flex: 1 }),
          customStyle,
        ])
      );
    });

    it('should apply custom style to ScrollView when scrollable', () => {
      const customStyle = { padding: 10 };
      const { UNSAFE_getByType } = render(
        <ScreenContainer scrollable style={customStyle}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const scrollView = UNSAFE_getByType(
        require('react-native').ScrollView
      );
      expect(scrollView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ flex: 1 }),
          customStyle,
        ])
      );
    });

    it('should apply background color from theme', () => {
      const { UNSAFE_getByType } = render(
        <ScreenContainer>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const safeAreaView = UNSAFE_getByType(
        require('react-native-safe-area-context').SafeAreaView
      );
      expect(safeAreaView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFFFFF' }),
        ])
      );
    });
  });

  describe('Combined Features', () => {
    it('should render with scrollable and keyboardAware together', () => {
      const { UNSAFE_getByType } = render(
        <ScreenContainer scrollable keyboardAware>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const scrollView = UNSAFE_getByType(
        require('react-native').ScrollView
      );
      const keyboardAvoidingView = UNSAFE_getByType(
        require('react-native').KeyboardAvoidingView
      );

      expect(scrollView).toBeTruthy();
      expect(keyboardAvoidingView).toBeTruthy();
    });

    it('should render complex children structure', () => {
      const { getByText } = render(
        <ScreenContainer scrollable keyboardAware>
          <View>
            <Text>Header</Text>
            <View>
              <Text>Content</Text>
            </View>
            <Text>Footer</Text>
          </View>
        </ScreenContainer>
      );

      expect(getByText('Header')).toBeTruthy();
      expect(getByText('Content')).toBeTruthy();
      expect(getByText('Footer')).toBeTruthy();
    });
  });

  describe('Requirements Validation', () => {
    it('should validate Requirement 6.1: Consistent SafeAreaView configuration', () => {
      // Test that SafeAreaView is applied with consistent configuration
      const { UNSAFE_getByType } = render(
        <ScreenContainer edges={['top', 'left', 'right']}>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const safeAreaView = UNSAFE_getByType(
        require('react-native-safe-area-context').SafeAreaView
      );
      expect(safeAreaView).toBeTruthy();
      expect(safeAreaView.props.edges).toEqual(['top', 'left', 'right']);
    });

    it('should validate Requirement 6.2: Proper keyboard handling', () => {
      // Test that KeyboardAvoidingView is properly configured
      const { UNSAFE_getByType } = render(
        <ScreenContainer keyboardAware>
          <Text>Test</Text>
        </ScreenContainer>
      );

      const keyboardAvoidingView = UNSAFE_getByType(
        require('react-native').KeyboardAvoidingView
      );
      expect(keyboardAvoidingView).toBeTruthy();
      expect(keyboardAvoidingView.props.style).toEqual({ flex: 1 });
    });

    it('should validate Requirement 6.4: Standardized ScreenContainer usage', () => {
      // Test that ScreenContainer provides a standardized interface
      const { UNSAFE_getByType } = render(
        <ScreenContainer
          edges={['top', 'left', 'right']}
          scrollable
          keyboardAware
          style={{ padding: 10 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text>Test</Text>
        </ScreenContainer>
      );

      // Should render all components correctly
      const safeAreaView = UNSAFE_getByType(
        require('react-native-safe-area-context').SafeAreaView
      );
      const scrollView = UNSAFE_getByType(
        require('react-native').ScrollView
      );
      const keyboardAvoidingView = UNSAFE_getByType(
        require('react-native').KeyboardAvoidingView
      );

      expect(safeAreaView).toBeTruthy();
      expect(scrollView).toBeTruthy();
      expect(keyboardAvoidingView).toBeTruthy();
    });
  });
});
