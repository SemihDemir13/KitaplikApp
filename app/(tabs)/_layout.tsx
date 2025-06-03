// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab'; // Bu dosya şablonda var, kontrol edin
import { IconSymbol } from '@/components/ui/IconSymbol'; // Bu dosya şablonda var, kontrol edin
import TabBarBackground from '@/components/ui/TabBarBackground'; // Bu dosya şablonda var, kontrol edin
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter,Link } from 'expo-router'; 
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native'; // TouchableOpacity için

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router=useRouter();

 return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
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
        name="index"
        options={{
          title: 'Kitaplığım',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name={focused ? 'house.fill' : 'house'} // IconSymbol'unuza uygun isimler
              size={28}
              color={color}
            />
          ),
          headerRight: () => (
            <Link href="/settings" asChild>
              <TouchableOpacity style={{ marginRight: 15, padding: 5 }}>
                <IconSymbol
                  name="gearshape" // Ayarlar ikonu için IconSymbol'unuza uygun bir isim
                  size={26}
                  color={Colors[colorScheme ?? 'light'].text}
                />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: 'İstatistikler',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name={focused ? 'chart.bar.fill' : 'chart.bar'} // IconSymbol'unuza uygun isimler
              size={28}
              color={color}
            />
          ),
        }}
      />
      {/* İsteğe bağlı olarak Ayarlar için ayrı bir tab da eklenebilir: */}
      
      <Tabs.Screen
        name="settings" // Bu, app/(tabs)/settings.tsx dosyasını gerektirir
                       // Eğer ayarları tab olarak değil de stack ekranı olarak istiyorsanız
                       // app/settings.tsx dosyasını kullanmaya devam edin ve headerRight'tan link verin.
                       // Şu anki yapımızda ayarlar stack ekranı, bu yüzden bu yorumda kalmalı.
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name={focused ? 'gearshape.fill' : 'gearshape'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      
    </Tabs>
  );
}