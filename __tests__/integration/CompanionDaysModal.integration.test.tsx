/**
 * Integration Tests for CompanionDaysModal with Vector Icons
 * Feature: emoji-to-vector-icons
 * 
 * These tests verify that the CompanionDaysModal component correctly
 * renders vector icons instead of emoji characters.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import CompanionDaysModal from '../../components/CompanionDaysModal';
import { useAppStore } from '../../store/useAppStore';

// Mock the store
jest.mock('../../store/useAppStore');
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

describe('CompanionDaysModal Integration Tests', () => {
  it('should not render emoji text for milestone icons', () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    mockUseAppStore.mockReturnValue({
      user: {
        firstEntryDate: sevenDaysAgo,
      },
    } as any);

    const { queryByText } = render(
      <CompanionDaysModal visible={true} onClose={() => {}} />
    );

    // Should not render emoji text
    expect(queryByText('🌱')).toBeNull();
    expect(queryByText('🌙')).toBeNull();
    expect(queryByText('💎')).toBeNull();
  });

  it('should not render emoji text for next milestone', () => {
    const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;
    mockUseAppStore.mockReturnValue({
      user: {
        firstEntryDate: oneDayAgo,
      },
    } as any);

    const { queryByText, queryAllByTestId } = render(
      <CompanionDaysModal visible={true} onClose={() => {}} />
    );

    // Should render next milestone icon
    const icons = queryAllByTestId('next-milestone-icon');
    expect(icons.length).toBeGreaterThan(0);
    
    // Should not render emoji text
    expect(queryByText('🌱')).toBeNull();
  });

  it('should not render emoji text for max achievement', () => {
    const longAgo = Date.now() - 1001 * 24 * 60 * 60 * 1000;
    mockUseAppStore.mockReturnValue({
      user: {
        firstEntryDate: longAgo,
      },
    } as any);

    const { queryByText } = render(
      <CompanionDaysModal visible={true} onClose={() => {}} />
    );

    // Should not render emoji text
    expect(queryByText('🎊')).toBeNull();
  });

  it('should render with no user data', () => {
    mockUseAppStore.mockReturnValue({
      user: null,
    } as any);

    const { queryAllByTestId } = render(
      <CompanionDaysModal visible={true} onClose={() => {}} />
    );

    // Should render next milestone (first milestone)
    const nextIcons = queryAllByTestId('next-milestone-icon');
    expect(nextIcons.length).toBeGreaterThan(0);
  });

  it('should not render any emoji characters', () => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    mockUseAppStore.mockReturnValue({
      user: {
        firstEntryDate: thirtyDaysAgo,
      },
    } as any);

    const { queryByText } = render(
      <CompanionDaysModal visible={true} onClose={() => {}} />
    );

    // Test all milestone emojis
    const emojis = ['🌱', '🌙', '💎', '🎉', '⭐', '👑', '🎊'];
    emojis.forEach(emoji => {
      expect(queryByText(emoji)).toBeNull();
    });
  });
});
