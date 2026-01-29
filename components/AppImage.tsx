import { Image } from 'expo-image';
import React from 'react';
import { AppImageProps } from '../types/components';

/**
 * Unified Image Component
 * 
 * A reusable wrapper around expo-image with optimized caching and loading.
 * Provides consistent image handling across the application.
 * 
 * Features:
 * - Advanced caching with memory-disk strategy
 * - Smooth transitions during loading
 * - Optional placeholder support (blurhash)
 * - Flexible content fit options
 * - Error handling
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
const AppImage: React.FC<AppImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  onError,
}) => {
  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      transition={200}
      placeholder={placeholder}
      cachePolicy="memory-disk"
      onError={onError}
    />
  );
};

export default React.memo(AppImage);
