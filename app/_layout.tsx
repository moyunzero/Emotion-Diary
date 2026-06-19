import { Lato_400Regular, Lato_700Bold, useFonts } from '@expo-google-fonts/lato';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import { AppState, Platform, StatusBar } from 'react-native';
/* eslint-disable import/no-duplicates -- RNGH：入口须先 side-effect 再命名导出 */
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
/* eslint-enable import/no-duplicates */
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RecordingSessionHost } from '../components/AudioRecorder/RecordingSessionHost';
import { changeAppLanguage, initI18n } from '../i18n';
import { refreshSystemLocaleIfNeeded } from '../store/refreshSystemLocaleIfNeeded';
import { initializeStore, cleanupStoreTimers, useAppStore } from '../store/useAppStore';
import { forceCancelRecording } from '../shared/audio/recordingCoordinator';
import { logger } from '../utils/logger';
import { installWebAlertPolyfill } from '../utils/webAlertPolyfill';

if (Platform.OS === 'web') {
  installWebAlertPolyfill();
}

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
        return;
      }

      if (next === 'active') {
        void (async () => {
          const { localePreference, effectiveLocale } = useAppStore.getState();
          const deviceTag =
            Localization.getLocales()[0]?.languageTag ?? 'zh-Hans';

          try {
            await refreshSystemLocaleIfNeeded(
              localePreference,
              effectiveLocale,
              deviceTag,
              (mapped) => useAppStore.setState({ effectiveLocale: mapped }),
            );
          } catch (error) {
            logger.error('RootLayout', '前台系统语言刷新失败', error);
          }
        })();
      }
    });
    return () => sub.remove();
  }, []);

  const [isI18nReady, setIsI18nReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void (async () => {
      try {
        const { effectiveLocale, preference } = await initI18n();
        useAppStore.getState()._hydrateLocale(preference, effectiveLocale);
        setIsI18nReady(true);
      } catch (error) {
        logger.error('RootLayout', 'i18n 初始化失败', error);
        try {
          await changeAppLanguage('zh-Hans');
        } catch (fallbackError) {
          logger.error('RootLayout', 'i18n 回退 zh-Hans 失败', fallbackError);
        }
        setIsI18nReady(true);
      }

      try {
        cleanup = initializeStore();
        setIsInitialized(true);
      } catch (error) {
        logger.error('RootLayout', '应用初始化失败', error);
        setIsInitialized(true);
      }
    })();

    return () => {
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          logger.error('RootLayout', '清理初始化资源失败', error);
        }
      }

      try {
        cleanupStoreTimers();
      } catch (error) {
        logger.error('RootLayout', '清理 store 定时器失败', error);
      }
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isI18nReady && isInitialized) {
      SplashScreen.hideAsync().catch((error) => {
        logger.warn('RootLayout', '隐藏启动画面失败', error);
      });
    }
  }, [fontsLoaded, fontError, isI18nReady, isInitialized]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!isI18nReady || !isInitialized) {
    return null;
  }

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
            <Stack.Screen
              name="recycle-bin"
              options={{ headerShown: false }}
            />
          </Stack>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
