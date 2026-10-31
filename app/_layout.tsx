import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import * as Localization from 'expo-localization';
import {
  AccessibilityInfo,
  Animated,
  Appearance,
  AppState,
  Platform,
  StatusBar,
} from 'react-native';
/* eslint-disable import/no-duplicates -- RNGH：入口须先 side-effect 再命名导出 */
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
/* eslint-enable import/no-duplicates */
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RecordingSessionHost } from '../components/AudioRecorder/RecordingSessionHost';
import { MetaphorOnboardingHost } from '../components/onboarding/MetaphorOnboardingHost';
import { changeAppLanguage, initI18n } from '../i18n';
import { refreshSystemLocaleIfNeeded } from '../store/refreshSystemLocaleIfNeeded';
import { refreshSystemAppearanceIfNeeded } from '../store/refreshSystemAppearance';
import {
  loadAppearancePreference,
  resolveEffectiveColorScheme,
} from '../services/appearanceSettings';
import { initializeStore, cleanupStoreTimers, useAppStore } from '../store/useAppStore';
import { forceCancelRecording } from '../shared/audio/recordingCoordinator';
import {
  publishWidgetSnapshot,
  clearWidgetSnapshot,
  scheduleWidgetSnapshotOp,
} from '../services/widgetSnapshot';
import { logger } from '../utils/logger';
import { installWebAlertPolyfill } from '../utils/webAlertPolyfill';
import { enableAsoPreviewQuiet } from '../services/asoPreviewQuiet';
import { useThemeStyles } from '../hooks/useThemeStyles';

if (Platform.OS === 'web') {
  installWebAlertPolyfill();
}

// App Preview 录屏：启动即静音 LogBox，避免黄条进成片
if (__DEV__ && process.env.EXPO_PUBLIC_ASO_PREVIEW === '1') {
  enableAsoPreviewQuiet();
}

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

const SCHEME_CROSSFADE_MS = 200;

function RootLayoutShell() {
  const { colors, effectiveColorScheme } = useThemeStyles();
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotionRef.current = enabled;
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        reduceMotionRef.current = enabled;
      },
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotionRef.current) {
      contentOpacity.setValue(1);
      return;
    }
    contentOpacity.setValue(0.94);
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: SCHEME_CROSSFADE_MS,
      useNativeDriver: true,
    }).start();
  }, [effectiveColorScheme, contentOpacity]);

  const statusBarStyle =
    effectiveColorScheme === 'night' ? 'light-content' : 'dark-content';
  const statusBarBackground = colors.surface;

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackground}
        translucent={Platform.OS === 'android'}
      />
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
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
          <Stack.Screen
            name="person-timeline"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="on-this-day"
            options={{ headerShown: false }}
          />
        </Stack>
        <MetaphorOnboardingHost />
      </Animated.View>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        useAppStore.getState().stopAudio();
        void forceCancelRecording();
        // D-10: only publish Soft Stack while signed in; logged-out stays cleared
        const { user, entries } = useAppStore.getState();
        if (user) {
          scheduleWidgetSnapshotOp(
            () => publishWidgetSnapshot(entries),
            'AppState publishWidgetSnapshot failed',
          );
        } else {
          scheduleWidgetSnapshotOp(
            () => clearWidgetSnapshot(),
            'AppState clearWidgetSnapshot failed',
          );
        }
        return;
      }

      if (next === 'active') {
        void (async () => {
          const {
            localePreference,
            effectiveLocale,
            appearancePreference,
            effectiveColorScheme,
          } = useAppStore.getState();
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

          try {
            await refreshSystemAppearanceIfNeeded(
              appearancePreference,
              effectiveColorScheme,
              (scheme) =>
                useAppStore.getState().setAppearanceScheme(scheme),
            );
          } catch (error) {
            logger.error('RootLayout', '前台系统外观刷新失败', error);
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

        const appearancePreference = await loadAppearancePreference();
        const effectiveColorScheme = resolveEffectiveColorScheme(
          appearancePreference,
          Appearance.getColorScheme(),
        );
        useAppStore
          .getState()
          ._hydrateAppearance(appearancePreference, effectiveColorScheme);

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
    if (isI18nReady && isInitialized) {
      SplashScreen.hideAsync().catch((error) => {
        logger.warn('RootLayout', '隐藏启动画面失败', error);
      });
    }
  }, [isI18nReady, isInitialized]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const { appearancePreference } = useAppStore.getState();
      if (appearancePreference.mode !== 'system') {
        return;
      }
      const scheme = resolveEffectiveColorScheme(
        appearancePreference,
        colorScheme,
      );
      useAppStore.getState().setAppearanceScheme(scheme);
    });
    return () => subscription.remove();
  }, []);

  if (!isI18nReady || !isInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <RootLayoutShell />
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
