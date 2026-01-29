import { AlertCircle, AlertTriangle, CheckCircle, Info, LucideIcon } from 'lucide-react-native';
import React from 'react';
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
 * Icon mapping for different message types
 */
const MESSAGE_ICON_MAP: Record<MessageType, { icon: LucideIcon; color: string }> = {
  success: {
    icon: CheckCircle,
    color: '#10B981', // green
  },
  error: {
    icon: AlertCircle,
    color: '#EF4444', // red
  },
  info: {
    icon: Info,
    color: '#3B82F6', // blue
  },
  warning: {
    icon: AlertTriangle,
    color: '#F59E0B', // amber
  },
};

/**
 * Specialized icon component for toast/alert messages
 * Automatically selects appropriate icon based on message type
 * 
 * @example
 * // Success message
 * <MessageIcon type="success" size={20} />
 * 
 * @example
 * // Error message with custom color
 * <MessageIcon type="error" size={24} color="#FF0000" />
 * 
 * @example
 * // Info message
 * <MessageIcon type="info" />
 */
const MessageIcon: React.FC<MessageIconProps> = ({
  type,
  size = 20,
  color,
  testID,
}) => {
  const config = MESSAGE_ICON_MAP[type];
  const iconColor = color || config.color;
  
  return (
    <AppIcon
      name={config.icon}
      size={size}
      color={iconColor}
      strokeWidth={2}
      testID={testID}
    />
  );
};

export default MessageIcon;
