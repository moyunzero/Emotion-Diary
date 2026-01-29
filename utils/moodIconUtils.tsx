import { Cloud, CloudLightning, CloudRain, Droplet, Zap } from 'lucide-react-native';
import React from 'react';

/**
 * 根据图标名称返回对应的情绪图标组件
 * @param iconName 图标名称（对应 MOOD_CONFIG 中的 iconName）
 * @param color 图标颜色
 * @param size 图标大小，默认为 20
 * @returns React 图标组件
 */
export const getMoodIcon = (iconName: string, color: string, size: number = 20) => {
  const iconProps = { size, color };
  switch (iconName) {
    case 'Droplet':
      return <Droplet {...iconProps} />;
    case 'Cloud':
      return <Cloud {...iconProps} />;
    case 'CloudRain':
      return <CloudRain {...iconProps} />;
    case 'CloudLightning':
      return <CloudLightning {...iconProps} />;
    case 'Zap':
      return <Zap {...iconProps} />;
    default:
      return <Droplet {...iconProps} />;
  }
};



