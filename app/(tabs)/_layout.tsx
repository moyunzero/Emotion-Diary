import { Tabs } from 'expo-router';
import React from 'react';
import { AppProvider } from '../../context/AppContext';

export default function TabLayout() {
  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarActiveTintColor: '#EF4444',
          tabBarInactiveTintColor: '#D1D5DB',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '气象站',
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: '记一笔',
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: '洞察',
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: '工具',
          }}
        />
      </Tabs>
    </AppProvider>
  );
}
