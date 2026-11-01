import { AlertCircle, AlertTriangle, CheckCircle, Info, LucideIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import AppIcon from './AppIcon';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageIconProps {
  /**
   * Type of message
   */
  type: MessageType;
  
  /**
   * Icon size
   * @default 20
   */
  size?: number;
  
  /**
   * Custom color (overrides default type color)
   */
  color?: string;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Specialized icon component for toast/alert messages
 * Automatically selects appropriate icon based on message type
 */
const MessageIcon: React.FC<MessageIconProps> = ({
  type,
  size = 20,
  color,
  testID,
}) => {
  const { colors } = useThemeStyles();
  const iconByType = useMemo(
    (): Record<MessageType, { icon: LucideIcon; color: string }> => ({
      success: { icon: CheckCircle, color: colors.success },
      error: { icon: AlertCircle, color: colors.error },
      info: { icon: Info, color: colors.primaryDark },
      warning: { icon: AlertTriangle, color: colors.warning },
    }),
    [colors],
  );
  const config = iconByType[type];
  const iconColor = color || config.color;
  
  return (
    <AppIcon
      name={config.icon}
      size={size}
      color={iconColor}
      testID={testID}
    />
  );
};

export default MessageIcon;
