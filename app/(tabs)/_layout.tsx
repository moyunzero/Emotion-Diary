import { Tabs } from 'expo-router';
import { CloudSun, Flower2, PenLine } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, DESIGN_TOKENS, withOpacity } from '@/constants/colors';

const TAB_ICON_SIZE = 24;

/** iOS: solid COLORS.bg until opaque underlay ships (G-23-6). Android: α0.92. */
function TabBarBackground() {
  const backgroundColor =
    Platform.OS === 'ios'
      ? COLORS.bg
      : withOpacity(COLORS.bg, 0.92);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor },
      ]}
    />
  );
}

export default function TabLayout() {
  const { t } = useTranslation('tabs');
  const insets = useSafeAreaInsets();

  // Note: Inline tabBarIcon functions are acceptable here per Expo Router conventions
  // - This is the standard pattern in React Navigation/Expo Router documentation
  // - TabLayout rarely re-renders (only when safe area insets change)
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
        tabBarBackground: () => <TabBarBackground />,
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
