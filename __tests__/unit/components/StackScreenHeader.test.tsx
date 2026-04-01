/**
 * StackScreenHeader：返回与标题渲染、无障碍标签
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StackScreenHeader } from '../../../components/StackScreenHeader';

describe('StackScreenHeader', () => {
  it('renders title and invokes onBack', () => {
    const onBack = jest.fn();
    render(<StackScreenHeader title="测试标题" onBack={onBack} />);

    expect(screen.getByText('测试标题')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('返回'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('uses custom back accessibility label', () => {
    const onBack = jest.fn();
    render(
      <StackScreenHeader title="" onBack={onBack} backAccessibilityLabel="返回上一页" />,
    );
    fireEvent.press(screen.getByLabelText('返回上一页'));
    expect(onBack).toHaveBeenCalled();
  });

  it('leading close invokes onBack with default 关闭 label', () => {
    const onClose = jest.fn();
    render(
      <StackScreenHeader
        leading="close"
        onBack={onClose}
        headerCenter={<></>}
        titleAccessibilityLabel="编辑记录"
      />,
    );
    fireEvent.press(screen.getByLabelText('关闭'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
