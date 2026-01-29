import { Tabs } from 'expo-router';
import { BarChart2, CloudSun, PenLine } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)', // 增加不透明度，更清晰
            borderTopWidth: 0, // 移除边框，改用阴影
            elevation: 8, // Android 阴影增强
            shadowColor: '#000', // iOS 阴影
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1, // 增加阴影不透明度
            shadowRadius: 12, // 增大阴影半径
            height: 60 + (insets.bottom || 10), // 动态高度：基础高度 + 安全区
            paddingTop: 8,
            paddingBottom: insets.bottom || 10, // 动态适配底部安全区
            borderTopLeftRadius: 20, // 添加顶部圆角，更治愈
            borderTopRightRadius: 20,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
            marginTop: 4,
          },
          tabBarActiveTintColor: '#EF4444', // 激活颜色：红色/粉色系
          tabBarInactiveTintColor: '#9CA3AF', // 未激活颜色：灰色
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '气象站',
            tabBarIcon: ({ color, size }) => (
              <CloudSun size={28} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: '记一笔',
            tabBarIcon: ({ color, size }) => (
              <PenLine size={28} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: '洞察',
            tabBarIcon: ({ color, size }) => (
              <BarChart2 size={28} color={color} strokeWidth={2} />
            ),
          }}
        />      </Tabs>
  );
}
