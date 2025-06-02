// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab'; // Bu dosya şablonda var, kontrol edin
import { IconSymbol } from '@/components/ui/IconSymbol'; // Bu dosya şablonda var, kontrol edin
import TabBarBackground from '@/components/ui/TabBarBackground'; // Bu dosya şablonda var, kontrol edin
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true, // Başlıkları göstermek için true yapalım
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index" // Bu, app/(tabs)/index.tsx dosyasını işaret eder
        options={{
          title: 'Kitaplığım', // Tab ve header başlığı
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? 'house.fill' : 'house'} // SF Symbol isimleri
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics" // Bu, app/(tabs)/statistics.tsx dosyasını işaret eder
        options={{
          title: 'İstatistikler', // Tab ve header başlığı
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name={focused ? 'chart.bar.fill' : 'chart.bar'} // SF Symbol isimleri (MAPPING'e eklemeniz gerekebilir)
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}