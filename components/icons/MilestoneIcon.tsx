import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getIconByEmoji } from '../../utils/iconMapping';
import AppIcon from './AppIcon';

export interface MilestoneIconProps {
  /**
   * Emoji character representing the milestone
   */
  emoji: string;
  
  /**
   * Icon size
   * @default 32
   */
  size?: number;
  
  /**
   * Icon color (typically from milestone theme)
   */
  color?: string;
  
  /**
   * Whether to show a background circle
   * @default false
   */
  showBackground?: boolean;
  
  /**
   * Background color
   */
  backgroundColor?: string;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Specialized icon component for milestone achievements
 * Provides consistent styling for milestone displays
 * 
 * @example
 * // Basic usage
 * <MilestoneIcon emoji="🌱" size={32} color="#10B981" />
 * 
 * @example
 * // With background circle
 * <MilestoneIcon 
 *   emoji="🌱" 
 *   size={32} 
 *   color="#10B981"
 *   showBackground={true}
 *   backgroundColor="#F3F4F6"
 * />
 */
const MilestoneIcon: React.FC<MilestoneIconProps> = ({
  emoji,
  size = 32,
  color = '#000000',
  showBackground = false,
  backgroundColor = '#F3F4F6',
  testID,
}) => {
  const iconComponent = getIconByEmoji(emoji);
  
  // Warn in development mode if no mapping found
  if (__DEV__ && !iconComponent) {
    console.warn(
      `[MilestoneIcon] No icon mapping found for emoji: "${emoji}". ` +
      `Please add mapping in utils/iconMapping.ts`
    );
  }
  
  // Return null if no icon mapping found
  if (!iconComponent) {
    return null;
  }
  
  const iconElement = (
    <AppIcon
      name={iconComponent}
      size={size}
      color={color}
      strokeWidth={2.5}
      testID={testID}
    />
  );
  
  if (showBackground) {
    return (
      <View
        style={[
          styles.backgroundContainer,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor,
          },
        ]}
        testID={testID ? `${testID}-container` : undefined}
      >
        {iconElement}
      </View>
    );
  }
  
  return iconElement;
};

const styles = StyleSheet.create({
  backgroundContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MilestoneIcon;
