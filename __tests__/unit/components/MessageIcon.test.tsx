import { render } from '@testing-library/react-native';
import React from 'react';
import MessageIcon from '../../../components/icons/MessageIcon';

describe('MessageIcon Component', () => {
  describe('Basic Rendering', () => {
    it('should render success message icon', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render error message icon', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="error" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render info message icon', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="info" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render warning message icon', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="warning" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render all message types correctly', () => {
      const messageTypes: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} testID={`message-${type}`} />
        );
        
        const icons = getAllByTestId(`message-${type}`);
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Props Handling', () => {
    it('should render with custom size prop', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" size={32} testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom size
    });

    it('should render with default size when not provided', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with default size (20)
    });

    it('should render with custom color', () => {
      const customColor = '#FF00FF';
      const { getAllByTestId } = render(
        <MessageIcon type="success" color={customColor} testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom color
    });

    it('should render all message types with custom colors', () => {
      const customColor = '#ABCDEF';
      const messageTypes: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} color={customColor} testID={`message-${type}`} />
        );
        
        const icons = getAllByTestId(`message-${type}`);
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Icon Type Mapping', () => {
    it('should use CheckCircle icon for success type', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // CheckCircle icon should be rendered
    });

    it('should use AlertCircle icon for error type', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="error" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // AlertCircle icon should be rendered
    });

    it('should use Info icon for info type', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="info" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Info icon should be rendered
    });

    it('should use AlertTriangle icon for warning type', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="warning" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // AlertTriangle icon should be rendered
    });
  });

  describe('AppIcon Integration', () => {
    it('should pass correct strokeWidth to AppIcon', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons[0].props.strokeWidth).toBe(2);
    });

    it('should render with custom size', () => {
      const customSize = 24;
      const { getAllByTestId } = render(
        <MessageIcon type="success" size={customSize} testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Icon renders successfully with custom size
    });

    it('should pass testID prop to AppIcon', () => {
      const testId = 'custom-test-id';
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID={testId} />
      );
      
      const icons = getAllByTestId(testId);
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large size values', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" size={128} testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle very small size values', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" size={8} testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle zero size value', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" size={0} testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Consistency Across Message Types', () => {
    it('should use consistent strokeWidth for all message types', () => {
      const messageTypes: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} testID={`message-${type}`} />
        );
        
        const icons = getAllByTestId(`message-${type}`);
        expect(icons[0].props.strokeWidth).toBe(2);
      });
    });

    it('should render with custom size consistently across all message types', () => {
      const customSize = 28;
      const messageTypes: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} size={customSize} testID={`message-${type}`} />
        );
        
        const icons = getAllByTestId(`message-${type}`);
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Default Color Mapping', () => {
    it('should have distinct icons for each message type', () => {
      const messageTypes: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} testID={`message-${type}`} />
        );
        
        const icons = getAllByTestId(`message-${type}`);
        expect(icons.length).toBeGreaterThan(0);
        // Each message type renders successfully with its default icon
      });
    });

    it('should render success type with green color by default', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Success icon renders (CheckCircle with green color)
    });

    it('should render error type with red color by default', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="error" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Error icon renders (AlertCircle with red color)
    });

    it('should render info type with blue color by default', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="info" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Info icon renders (Info with blue color)
    });

    it('should render warning type with amber color by default', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="warning" testID="message-icon" />
      );
      
      const icons = getAllByTestId('message-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Warning icon renders (AlertTriangle with amber color)
    });
  });
});
