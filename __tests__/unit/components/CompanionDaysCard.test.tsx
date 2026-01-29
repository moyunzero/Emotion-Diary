/**
 * CompanionDaysCard 组件单元测试
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import CompanionDaysCard from '../../../components/CompanionDaysCard';
import { useAppStore } from '../../../store/useAppStore';

// Mock useAppStore
jest.mock('../../../store/useAppStore');

describe('CompanionDaysCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render陪伴天数 label', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User' },
      entries: [],
    });

    const { getByText } = render(<CompanionDaysCard onPress={() => {}} />);
    
    expect(getByText('陪伴天数')).toBeTruthy();
  });

  it('should display a number when firstEntryDate is not set', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User' },
      entries: [],
    });

    const { getByText } = render(<CompanionDaysCard onPress={() => {}} />);
    
    // Should display 0 initially
    expect(getByText('0')).toBeTruthy();
  });

  it('should render when firstEntryDate is set', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      user: { 
        id: '1', 
        name: 'Test User',
        firstEntryDate: threeDaysAgo,
      },
      entries: [{ id: '1', timestamp: threeDaysAgo }],
    });

    const { getByText } = render(<CompanionDaysCard onPress={() => {}} />);
    
    // Component should render without crashing
    expect(getByText('陪伴天数')).toBeTruthy();
    // Note: We don't test the exact number due to animation complexity in tests
  });

  it('should call onPress when card is pressed', () => {
    const onPressMock = jest.fn();
    
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User' },
      entries: [],
    });

    const { getByText } = render(<CompanionDaysCard onPress={onPressMock} />);
    
    const labelElement = getByText('陪伴天数');
    // 向上遍历找到 TouchableOpacity
    let touchable = labelElement.parent;
    while (touchable && !touchable.props.onPress) {
      touchable = touchable.parent;
    }
    
    if (touchable && touchable.props.onPress) {
      fireEvent.press(touchable);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    } else {
      throw new Error('Could not find TouchableOpacity');
    }
  });
});
