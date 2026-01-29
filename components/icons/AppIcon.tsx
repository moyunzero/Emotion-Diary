import { AlertCircle, LucideIcon } from 'lucide-react-native';
import React, { memo } from 'react';
import { getIconByEmoji } from '../../utils/iconMapping';

export interface AppIconProps {
  /**
   * Icon name from lucide-react-native or emoji character
   */
  name: string | LucideIcon;
  
  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Icon color
   * @default '#000000'
   */
  color?: string;
  
  /**
   * Stroke width for the icon
   * @default 2
   */
  strokeWidth?: number;
  
  /**
   * Fallback icon to use if the specified icon is not found
   * @default AlertCircle
   */
  fallbackIcon?: LucideIcon;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Base icon component that wraps lucide-react-native icons
 * Provides consistent interface and fallback handling
 * 
 * @example
 * // Using with emoji
 * <AppIcon name="😔" size={32} color="#FF0000" />
 * 
 * @example
 * // Using with direct icon component
 * <AppIcon name={Heart} size={24} color="#FF69B4" />
 * 
 * @example
 * // With custom fallback
 * <AppIcon name="invalid" fallbackIcon={HelpCircle} />
 */
const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 24,
  color = '#000000',
  strokeWidth = 2,
  fallbackIcon = AlertCircle,
  testID,
}) => {
  // Determine which icon to render
  let IconComponent: LucideIcon;
  
  if (typeof name === 'string') {
    // Try to get icon by emoji mapping
    const mappedIcon = getIconByEmoji(name);
    
    if (mappedIcon) {
      IconComponent = mappedIcon;
    } else {
      // Log warning in development mode for missing mappings
      if (__DEV__) {
        console.warn(
          `[AppIcon] No icon mapping found for: "${name}". Using fallback icon.`
        );
      }
      IconComponent = fallbackIcon;
    }
  } else {
    // Direct icon component passed
    IconComponent = name;
  }
  
  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      testID={testID}
    />
  );
};

export default memo(AppIcon);
