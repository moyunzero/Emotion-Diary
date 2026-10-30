import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { CloudSun, Flower2, PenLine } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DESIGN_TOKENS, withOpacity } from '@/constants/colors';

const TAB_ICON_SIZE = 24;

function TabBarBackground({ solid }: { solid: boolean }) {
  if (Platform.OS === 'ios' && !solid) {
    return (
      <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
    );
  }
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: solid
            ? COLORS.bg
            : withOpacity(COLORS.bg, 0.92),
        },
      ]}
    />
  );
}

export default function TabLayout() {
  const { t } = useTranslation('tabs');
  const insets = useSafeAreaInsets();
  const [preferSolidChrome, setPreferSolidChrome] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncA11y = async () => {
      try {
        const [reduceMotion, reduceTransparency] = await Promise.all([
          AccessibilityInfo.isReduceMotionEnabled(),
          AccessibilityInfo.isReduceTransparencyEnabled(),
        ]);
        if (mounted) {
          setPreferSolidChrome(Boolean(reduceMotion || reduceTransparency));
        }
      } catch {
        /* ignore */
      }
    };

    void syncA11y();

    const motionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      () => {
        void syncA11y();
      },
    );
    const transparencySub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      () => {
        void syncA11y();
      },
    );

    return () => {
      mounted = false;
      motionSub.remove();
      transparencySub.remove();
    };
  }, []);

  // Note: Inline tabBarIcon functions are acceptable here per Expo Router conventions
  // - This is the standard pattern in React Navigation/Expo Router documentation
  // - TabLayout rarely re-renders (only when safe area / a11y prefs change)
  // - Icon components are lightweight SVGs with no performance impact
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: COLORS.hairline,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
          height: 60 + (insets.bottom || 10),
          paddingTop: 8,
          paddingBottom: insets.bottom || 10,
        },
        tabBarBackground: () => <TabBarBackground solid={preferSolidChrome} />,
        tabBarLabelStyle: {
          fontSize: DESIGN_TOKENS.fontSize.footnote,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: COLORS.tab.active,
        tabBarInactiveTintColor: COLORS.tab.inactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('index'),
          tabBarButtonTestID: 'tab-dashboard',
          tabBarIcon: ({ color }) => (
            <CloudSun size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: t('record'),
          tabBarButtonTestID: 'tab-record',
          tabBarIcon: ({ color }) => (
            <PenLine size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          lazy: true,
          title: t('insights'),
          tabBarButtonTestID: 'tab-insights',
          tabBarIcon: ({ color }) => (
            <Flower2 size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
