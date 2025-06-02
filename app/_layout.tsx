// C:/Users/yunus/KitapligimApp/app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // expo-status-bar'dan import edin
import 'react-native-reanimated';
import { useEffect } from 'react'; // SplashScreen için
import * as SplashScreen from 'expo-splash-screen'; // SplashScreen için

import { useColorScheme } from '@/hooks/useColorScheme'; // @/ alias'ı ile

// Uygulama açılırken splash screen'i görünür tut
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({ // Hata değişkenini de alalım
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'), // YOLU GÜNCELLEDİK
  });

  useEffect(() => {
    if (loaded || error) { // Font yüklendiğinde veya yükleme hatası olduğunda splash screen'i gizle
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Font yükleme hatası varsa veya henüz yüklenmediyse null dön (veya bir yükleme ekranı)
  if (!loaded && !error) {
    return null;
  }

  // Font yüklenirken bir hata oluştuysa, bir hata mesajı gösterebilir veya fallback font kullanabilirsiniz.
  if (error) {
    console.error('Font yüklenirken hata oluştu:', error);
    // Burada isteğe bağlı olarak bir hata mesajı UI'ı gösterebilirsiniz.
    // Veya fallback bir mekanizma ile devam edebilirsiniz.
    // Şimdilik basitçe null dönüyoruz, ama idealde kullanıcıya bilgi verilmeli.
  }


  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        {/* Kitap ekleme ve detay ekranları için Stack.Screen tanımları buraya eklenebilir,
            ancak Expo Router genellikle bunları dosya adlarından otomatik algılar.
            Eğer özel header başlıkları veya seçenekleri istiyorsanız buraya ekleyebilirsiniz:
        <Stack.Screen name="add-book" options={{ title: 'Yeni Kitap Ekle' }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Kitap Detayı' }} />
        */}
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}