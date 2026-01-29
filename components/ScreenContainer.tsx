import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStyles } from '../hooks/useThemeStyles';

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  keyboardAware?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Unified ScreenContainer component
 * 
 * Provides consistent SafeAreaView, KeyboardAvoidingView, and ScrollView integration
 * across all screens in the application.
 * 
 * @param children - The content to render inside the container
 * @param edges - SafeAreaView edges to apply (default: ['top', 'left', 'right', 'bottom'])
 * @param scrollable - Whether the content should be scrollable (default: false)
 * @param keyboardAware - Whether to handle keyboard interactions (default: false)
 * @param style - Additional styles for the container or ScrollView
 * @param contentContainerStyle - Additional styles for ScrollView contentContainerStyle
 * 
 * @example
 * // Dashboard (non-scrollable, custom scroll handling)
 * <ScreenContainer edges={['top', 'left', 'right']}>
 *   <FlashList {...props} />
 * </ScreenContainer>
 * 
 * @example
 * // Record (scrollable with keyboard)
 * <ScreenContainer scrollable keyboardAware>
 *   <MoodForm {...props} />
 * </ScreenContainer>
 * 
 * @example
 * // Profile (scrollable, no keyboard)
 * <ScreenContainer scrollable>
 *   <ProfileContent />
 * </ScreenContainer>
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
  scrollable = false,
  keyboardAware = false,
  style,
  contentContainerStyle,
}) => {
  const { colors } = useThemeStyles();

  const content = scrollable ? (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <>{children}</>
  );

  const wrappedContent = keyboardAware ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.background.page },
        !scrollable && style,
      ]}
      edges={edges}
    >
      {wrappedContent}
    </SafeAreaView>
  );
};

export default ScreenContainer;
