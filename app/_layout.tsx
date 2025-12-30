import 'react-native-gesture-handler';
import { Lato_400Regular, Lato_700Bold, useFonts } from '@expo-google-fonts/lato';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeStore } from '../store/useAppStore';

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 加载Lato字体
  const [fontsLoaded, fontError] = useFonts({
    'Lato_400Regular': Lato_400Regular,
    'Lato_700Bold': Lato_700Bold,
  });

  useEffect(() => {
    // 初始化 Zustand Store（加载数据、设置监听器等）
    const cleanup = initializeStore();
    
    if (fontsLoaded || fontError) {
      // 字体加载完成或出错后隐藏启动画面
      SplashScreen.hideAsync();
    }
    
    // 返回清理函数
    return () => {
      if (cleanup) cleanup();
    };
  }, [fontsLoaded, fontError]);

  // 字体加载失败时，应用仍可运行（会使用系统默认字体）
  if (!fontsLoaded && !fontError) {
    return null; // 显示启动画面直到字体加载完成
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#FFF5F5"
          translucent={Platform.OS === 'android'}
        />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="profile" 
            options={{ 
              headerShown: false,
              // 移除自定义动画配置，使用系统默认，避免潜在的 Native 崩溃
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
