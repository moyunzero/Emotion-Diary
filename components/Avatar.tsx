import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  onPress?: () => void;
  style?: any;
}

/**
 * 统一的头像组件
 * 处理头像显示、错误处理和占位符
 */
const Avatar: React.FC<AvatarProps> = ({ 
  uri, 
  name, 
  size = 40, 
  onPress,
  style 
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
        onError={() => setAvatarError(true)}
      />
    );
  };

  const content = avatarContent();

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
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


