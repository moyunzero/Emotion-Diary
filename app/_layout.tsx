import { Lato_400Regular, Lato_700Bold, useFonts } from '@expo-google-fonts/lato';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
/* eslint-disable import/no-duplicates -- RNGH：入口须先 side-effect 再命名导出 */
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
/* eslint-enable import/no-duplicates */
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RecordingSessionHost } from '../components/AudioRecorder/RecordingSessionHost';
import { initializeStore, cleanupStoreTimers, useAppStore } from '../store/useAppStore';
import { forceCancelRecording } from '../shared/audio/recordingCoordinator';
import { logger } from '../utils/logger';

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 加载Lato字体
  const [fontsLoaded, fontError] = useFonts({
    'Lato_400Regular': Lato_400Regular,
    'Lato_700Bold': Lato_700Bold,
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
      }
    });
    return () => sub.remove();
  }, []);

  // 添加初始化状态，确保初始化完成后再隐藏启动画面
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 初始化应用（只执行一次）
    let cleanup: (() => void) | undefined;
    
    try {
      // 初始化 Zustand Store（加载数据、设置监听器等）
      // 添加错误处理，防止初始化失败导致应用崩溃
      cleanup = initializeStore();
      
      // 标记初始化完成
      setIsInitialized(true);
    } catch (error) {
      // 捕获初始化错误，记录但不阻止应用启动
      logger.error('RootLayout', '应用初始化失败', error);
      setIsInitialized(true); // 即使失败也标记为完成，允许应用继续运行
    }
    
    // 返回清理函数
    return () => {
      // 清理认证监听器
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          logger.error('RootLayout', '清理初始化资源失败', error);
        }
      }
      
      // 清理所有 store 定时器（防抖定时器、保存定时器等）
      try {
        cleanupStoreTimers();
      } catch (error) {
        logger.error('RootLayout', '清理 store 定时器失败', error);
      }
    };
  }, []); // 只在组件挂载时执行一次

  // 当字体加载完成且初始化完成时，隐藏启动画面
  useEffect(() => {
    if ((fontsLoaded || fontError) && isInitialized) {
      SplashScreen.hideAsync().catch((error) => {
        logger.warn('RootLayout', '隐藏启动画面失败', error);
        // 不阻止应用继续运行
      });
    }
  }, [fontsLoaded, fontError, isInitialized]);

  // 字体加载失败时，应用仍可运行（会使用系统默认字体）
  // 等待字体加载或初始化完成
  if (!fontsLoaded && !fontError) {
    return null; // 显示启动画面直到字体加载完成
  }

  // 如果初始化未完成，继续显示启动画面
  if (!isInitialized) {
    return null;
  }

  // 使用固定的浅色主题
  const statusBarStyle = 'dark-content';
  const statusBarBackground = '#FFFFFF';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar 
            barStyle={statusBarStyle}
            backgroundColor={statusBarBackground}
            translucent={Platform.OS === 'android'}
          />
          <RecordingSessionHost />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="profile" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen
              name="review-export"
              options={{ headerShown: false }}
            />
          </Stack>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
