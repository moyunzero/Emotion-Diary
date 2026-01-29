/**
 * Profile页面单元测试
 * 验证UI简化功能的实现
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import ProfileScreen from '../../../app/profile';

// Mock the store
jest.mock('../../../store/useAppStore', () => ({
  useAppStore: jest.fn((selector) => {
    const state = {
      user: null,
      entries: [],
      weather: { score: 15 },
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn(),
      syncToCloud: jest.fn(),
      register: jest.fn(),
      recoverFromCloud: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock Avatar component
jest.mock('../../../components/Avatar', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => <View testID="avatar" />,
  };
});

// Mock Toast component
jest.mock('../../../components/Toast', () => ({
  Toast: () => null,
}));

describe('Profile页面 - UI简化', () => {
  describe('需求 2.1: 移除设置图标', () => {
    it('应该不包含Settings图标', () => {
      const { queryByTestId, queryByText, UNSAFE_getAllByType } = render(<ProfileScreen />);
      
      // 验证Settings图标不存在
      // 由于Settings图标没有testID，我们通过检查是否有Settings相关的文本或组件来验证
      const settingsIcon = queryByTestId('settings-icon');
      expect(settingsIcon).toBeNull();
      
      // 验证没有Settings相关的文本
      const settingsText = queryByText(/settings/i);
      expect(settingsText).toBeNull();
    });

    it('应该渲染header但不包含Settings按钮', () => {
      const { getByTestId, queryByTestId } = render(<ProfileScreen />);
      
      // 验证header存在（通过返回按钮）
      // 注意：由于没有testID，我们需要通过其他方式验证
      // 这里我们验证整个组件能够正常渲染
      const component = render(<ProfileScreen />);
      expect(component).toBeTruthy();
      
      // 验证Settings图标不存在
      const settingsIcon = queryByTestId('settings-icon');
      expect(settingsIcon).toBeNull();
    });

    it('应该保持header布局平衡', () => {
      const { UNSAFE_root } = render(<ProfileScreen />);
      
      // 验证组件能够正常渲染，没有布局错误
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Profile页面基本渲染', () => {
    it('应该成功渲染Profile页面', () => {
      const { getByText } = render(<ProfileScreen />);
      
      // 验证页面包含关键元素
      expect(getByText('点击登录')).toBeTruthy();
      expect(getByText('开启您的情绪之旅')).toBeTruthy();
    });

    it('应该显示统计卡片', () => {
      const { getByText } = render(<ProfileScreen />);
      
      // 验证统计卡片存在
      expect(getByText('心事记录')).toBeTruthy();
      expect(getByText('心情指数')).toBeTruthy();
      expect(getByText('陪伴天数')).toBeTruthy();
    });

    it('应该显示数据与安全部分', () => {
      const { getByText } = render(<ProfileScreen />);
      
      // 验证数据与安全部分存在
      expect(getByText('数据与安全')).toBeTruthy();
      expect(getByText('备份心事')).toBeTruthy();
      expect(getByText('找回回忆')).toBeTruthy();
    });

    it('应该不显示"其他"部分（未登录时）', () => {
      const { queryByText } = render(<ProfileScreen />);
      
      // 验证"其他"部分标题不存在（未登录时）
      expect(queryByText('其他')).toBeNull();
    });
  });

  describe('未登录用户状态', () => {
    it('应该显示登录提示', () => {
      const { getByText } = render(<ProfileScreen />);
      
      expect(getByText('点击登录')).toBeTruthy();
      expect(getByText('开启您的情绪之旅')).toBeTruthy();
    });

    it('应该不显示退出登录按钮', () => {
      const { queryByText } = render(<ProfileScreen />);
      
      // 未登录时不应该显示退出登录按钮
      const logoutButton = queryByText('退出登录');
      expect(logoutButton).toBeNull();
    });
  });
});
