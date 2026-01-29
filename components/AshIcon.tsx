/**
 * 灰烬图标组件 - SVG 图标
 * 用于焚烧后的情绪卡片，替代 emoji 以确保跨平台一致性
 * 设计为简洁的火焰/灰烬图标，传达"已焚烧"的语义
 */
import React from 'react';
import Svg, { Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AshIconProps {
  size?: number;
  opacity?: number;
  color?: string;
}

const AshIcon: React.FC<AshIconProps> = ({ 
  size = 24, 
  opacity = 0.6,
  color = '#9CA3AF' // 默认灰色
}) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      opacity={opacity}
    >
      <Defs>
        <LinearGradient id="ashGradient" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      <G>
        {/* 主火焰形状 - 简洁的火焰轮廓 */}
        <Path
          d="M12 22C8.13 22 5 18.87 5 15C5 12.5 6.5 10.5 8 9C8.5 8.5 9 8 9.5 7.5C10 7 10.5 6.5 11 6C11.5 6.5 12 7 12.5 7.5C13 8 13.5 8.5 14 9C15.5 10.5 17 12.5 17 15C17 18.87 13.87 22 10 22H12Z"
          fill="url(#ashGradient)"
        />
        {/* 内部高光 - 增加层次感 */}
        <Path
          d="M12 20C9.24 20 7 17.76 7 15C7 13.5 8 12 9 11C9.5 10.5 10 10 10.5 9.5C11 9 11.5 8.5 12 8C12.5 8.5 13 9 13.5 9.5C14 10 14.5 10.5 15 11C16 12 17 13.5 17 15C17 17.76 14.76 20 12 20Z"
          fill={color}
          opacity="0.25"
        />
        {/* 顶部小火焰 - 增加细节 */}
        <Path
          d="M12 6C11.5 6 11 6.2 10.5 6.5C10 6.8 9.5 7.2 9 7.5C8.5 7.8 8 8 7.5 8.2C7 8.4 6.5 8.5 6 8.5C5.5 8.5 5 8.3 4.5 8C4 7.7 3.5 7.3 3 6.8C2.5 6.3 2 5.8 1.5 5.2C1 4.6 0.5 4 0 3.3C0.5 3.5 1 3.7 1.5 3.9C2 4.1 2.5 4.3 3 4.5C3.5 4.7 4 4.9 4.5 5.1C5 5.3 5.5 5.5 6 5.7C6.5 5.9 7 6.1 7.5 6.3C8 6.5 8.5 6.7 9 6.9C9.5 7.1 10 7.3 10.5 7.5C11 7.7 11.5 7.9 12 8C12.5 7.9 13 7.7 13.5 7.5C14 7.3 14.5 7.1 15 6.9C15.5 6.7 16 6.5 16.5 6.3C17 6.1 17.5 5.9 18 5.7C18.5 5.5 19 5.3 19.5 5.1C20 4.9 20.5 4.7 21 4.5C21.5 4.3 22 4.1 22.5 3.9C23 3.7 23.5 3.5 24 3.3C23.5 4 23 4.6 22.5 5.2C22 5.8 21.5 6.3 21 6.8C20.5 7.3 20 7.7 19.5 8C19 8.3 18.5 8.5 18 8.5C17.5 8.5 17 8.4 16.5 8.2C16 8 15.5 7.8 15 7.5C14.5 7.2 14 6.8 13.5 6.5C13 6.2 12.5 6 12 6Z"
          fill={color}
          opacity="0.15"
        />
      </G>
    </Svg>
  );
};

export default AshIcon;
