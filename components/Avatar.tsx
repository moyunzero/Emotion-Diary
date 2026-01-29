import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AvatarProps } from '../types/components';

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

  const avatarContent = () => {
    if (avatarError || !uri) {
      return (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>
            {name?.charAt(0) || '?'}
          </Text>
        </View>
      );
    }

    return (
      <Image 
        source={{ uri }} 
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={200}
        placeholder={placeholder}
        cachePolicy="memory-disk"
        onError={() => setAvatarError(true)}
      />
    );
  };

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
  placeholder: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default React.memo(Avatar);


