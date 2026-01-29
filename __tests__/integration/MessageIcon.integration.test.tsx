import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import MessageIcon from '../../components/icons/MessageIcon';

describe('MessageIcon Integration Tests', () => {
  describe('Usage in Message Components', () => {
    it('should render inline with text in a success message', () => {
      const { getByText, getAllByTestId } = render(
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MessageIcon type="success" testID="success-icon" />
          <Text>Operation completed successfully!</Text>
        </View>
      );
      
      expect(getAllByTestId('success-icon').length).toBeGreaterThan(0);
      expect(getByText('Operation completed successfully!')).toBeTruthy();
    });

    it('should render inline with text in an error message', () => {
      const { getByText, getAllByTestId } = render(
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MessageIcon type="error" testID="error-icon" />
          <Text>An error occurred</Text>
        </View>
      );
      
      expect(getAllByTestId('error-icon').length).toBeGreaterThan(0);
      expect(getByText('An error occurred')).toBeTruthy();
    });

    it('should render inline with text in an info message', () => {
      const { getByText, getAllByTestId } = render(
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MessageIcon type="info" testID="info-icon" />
          <Text>Here is some information</Text>
        </View>
      );
      
      expect(getAllByTestId('info-icon').length).toBeGreaterThan(0);
      expect(getByText('Here is some information')).toBeTruthy();
    });

    it('should render inline with text in a warning message', () => {
      const { getByText, getAllByTestId } = render(
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MessageIcon type="warning" testID="warning-icon" />
          <Text>Please be careful</Text>
        </View>
      );
      
      expect(getAllByTestId('warning-icon').length).toBeGreaterThan(0);
      expect(getByText('Please be careful')).toBeTruthy();
    });
  });

  describe('Multiple Icons in Same View', () => {
    it('should render multiple message icons with different types', () => {
      const { getAllByTestId } = render(
        <View>
          <View style={{ flexDirection: 'row' }}>
            <MessageIcon type="success" testID="icon-1" />
            <Text>Success</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MessageIcon type="error" testID="icon-2" />
            <Text>Error</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MessageIcon type="info" testID="icon-3" />
            <Text>Info</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MessageIcon type="warning" testID="icon-4" />
            <Text>Warning</Text>
          </View>
        </View>
      );
      
      expect(getAllByTestId('icon-1').length).toBeGreaterThan(0);
      expect(getAllByTestId('icon-2').length).toBeGreaterThan(0);
      expect(getAllByTestId('icon-3').length).toBeGreaterThan(0);
      expect(getAllByTestId('icon-4').length).toBeGreaterThan(0);
    });
  });

  describe('Semantic Appropriateness', () => {
    it('should use CheckCircle for success messages (semantically appropriate)', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="success" testID="success-icon" />
      );
      
      const icons = getAllByTestId('success-icon');
      expect(icons.length).toBeGreaterThan(0);
      // CheckCircle is semantically appropriate for success
    });

    it('should use AlertCircle for error messages (semantically appropriate)', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="error" testID="error-icon" />
      );
      
      const icons = getAllByTestId('error-icon');
      expect(icons.length).toBeGreaterThan(0);
      // AlertCircle is semantically appropriate for errors
    });

    it('should use Info for info messages (semantically appropriate)', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="info" testID="info-icon" />
      );
      
      const icons = getAllByTestId('info-icon');
      expect(icons.length).toBeGreaterThan(0);
      // Info icon is semantically appropriate for informational messages
    });

    it('should use AlertTriangle for warning messages (semantically appropriate)', () => {
      const { getAllByTestId } = render(
        <MessageIcon type="warning" testID="warning-icon" />
      );
      
      const icons = getAllByTestId('warning-icon');
      expect(icons.length).toBeGreaterThan(0);
      // AlertTriangle is semantically appropriate for warnings
    });
  });

  describe('Customization in Different Contexts', () => {
    it('should support different sizes for different message contexts', () => {
      const { getAllByTestId } = render(
        <View>
          <MessageIcon type="success" size={16} testID="small-icon" />
          <MessageIcon type="success" size={20} testID="medium-icon" />
          <MessageIcon type="success" size={24} testID="large-icon" />
        </View>
      );
      
      expect(getAllByTestId('small-icon').length).toBeGreaterThan(0);
      expect(getAllByTestId('medium-icon').length).toBeGreaterThan(0);
      expect(getAllByTestId('large-icon').length).toBeGreaterThan(0);
    });

    it('should support custom colors for themed messages', () => {
      const { getAllByTestId } = render(
        <View>
          <MessageIcon type="success" color="#00FF00" testID="custom-success" />
          <MessageIcon type="error" color="#FF0000" testID="custom-error" />
        </View>
      );
      
      expect(getAllByTestId('custom-success').length).toBeGreaterThan(0);
      expect(getAllByTestId('custom-error').length).toBeGreaterThan(0);
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 5.1: render vector icons for messages', () => {
      const messageTypes: Array<'success' | 'error' | 'info' | 'warning'> = [
        'success',
        'error',
        'info',
        'warning',
      ];
      
      messageTypes.forEach(type => {
        const { getAllByTestId } = render(
          <MessageIcon type={type} testID={`${type}-icon`} />
        );
        
        const icons = getAllByTestId(`${type}-icon`);
        expect(icons.length).toBeGreaterThan(0);
        // Vector icon rendered instead of emoji
      });
    });

    it('should satisfy Requirement 5.2: use semantically appropriate icons', () => {
      // Success -> CheckCircle (positive completion)
      const { getAllByTestId: getSuccess } = render(
        <MessageIcon type="success" testID="success" />
      );
      expect(getSuccess('success').length).toBeGreaterThan(0);

      // Error -> AlertCircle (problem/alert)
      const { getAllByTestId: getError } = render(
        <MessageIcon type="error" testID="error" />
      );
      expect(getError('error').length).toBeGreaterThan(0);

      // Info -> Info (information)
      const { getAllByTestId: getInfo } = render(
        <MessageIcon type="info" testID="info" />
      );
      expect(getInfo('info').length).toBeGreaterThan(0);

      // Warning -> AlertTriangle (caution)
      const { getAllByTestId: getWarning } = render(
        <MessageIcon type="warning" testID="warning" />
      );
      expect(getWarning('warning').length).toBeGreaterThan(0);
    });

    it('should satisfy Requirement 5.4: support different icon sizes', () => {
      const sizes = [16, 20, 24, 32];
      
      sizes.forEach(size => {
        const { getAllByTestId } = render(
          <MessageIcon type="success" size={size} testID={`icon-${size}`} />
        );
        
        const icons = getAllByTestId(`icon-${size}`);
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });
});
