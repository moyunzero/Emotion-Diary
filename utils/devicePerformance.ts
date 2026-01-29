import { Platform } from 'react-native';

type PerformanceLevel = 'high' | 'medium' | 'low';

let cachedLevel: PerformanceLevel | null = null;

export const getDevicePerformanceLevel = async (): Promise<PerformanceLevel> => {
  if (Platform.OS === 'ios') {
    return 'high';
  }

  try {
    // 使用动态导入避免原生模块不存在时的启动崩溃
    const Device = await import('expo-device');
    const totalMemory = await Device.getMaxMemoryAsync();
    
    if (!totalMemory) {
      return 'medium';
    }
    
    const memoryGB = totalMemory / (1024 * 1024 * 1024);
    
    if (memoryGB >= 6) return 'high';
    if (memoryGB >= 3) return 'medium';
    return 'low';
  } catch {
    // 模块不可用或获取失败时降级为 medium
    return 'medium';
  }
};

export const getCachedPerformanceLevel = async (): Promise<PerformanceLevel> => {
  if (!cachedLevel) {
    cachedLevel = await getDevicePerformanceLevel();
  }
  return cachedLevel;
};

export const isLowEndDevice = async (): Promise<boolean> => {
  const level = await getCachedPerformanceLevel();
  return level === 'low';
};
