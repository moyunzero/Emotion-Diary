import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AvatarProps } from '../types/components';
import { getDefaultAvatar, isSvgAvatarDataUri } from '../utils/avatarPresets';

/**
 * 统一的头像组件
 * 处理头像显示、错误处理和占位符
 * 使用 expo-image 提供高级缓存和加载功能
 */
const Avatar: React.FC<AvatarProps> = ({ 
  uri, 
  name, 
  size = 40, 
  onPress,
  style,
  placeholder 
}) => {
  const [avatarError, setAvatarError] = useState(false);

  const hasRemoteUri = Boolean(uri && String(uri).trim());
  const fallbackUri = getDefaultAvatar(name ?? undefined);
  const displayUri = !hasRemoteUri || avatarError ? fallbackUri : String(uri).trim();

  useEffect(() => {
    setAvatarError(false);
  }, [uri]);

  const avatarContent = () => (
    <Image
      source={{ uri: displayUri }}
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      contentFit={isSvgAvatarDataUri(displayUri) ? 'contain' : 'cover'}
      contentPosition="center"
      transition={200}
      placeholder={placeholder}
      cachePolicy="memory-disk"
      onError={() => setAvatarError(true)}
    />
  );

  const content = avatarContent();

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.container, style]} testID="avatar">
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]} testID="avatar">
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});

export default React.memo(Avatar);


