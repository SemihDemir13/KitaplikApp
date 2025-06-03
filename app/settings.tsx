// C:/Users/yunus/KitapligimApp/app/settings.tsx

import React from 'react';
import { View, StyleSheet, Button as RNButton, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { clearAllBooks, getAllBooks } from '@/services/bookStorage'; // Servisleri import et

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleClearAllData = async () => {
    Alert.alert(
      "Tüm Verileri Sil",
      "Bu işlem tüm kitaplık verilerinizi kalıcı olarak silecek. Emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Tümünü Sil",
          style: "destructive",
          onPress: async () => {
            await clearAllBooks(); // bookStorage'dan fonksiyonu çağır
            Alert.alert("Başarılı", "Tüm kitaplık verileri silindi.");
            // İsteğe bağlı: Kullanıcıyı ana ekrana yönlendir ve ana ekranın veriyi yenilemesini sağla
            // Bu, useFocusEffect sayesinde zaten olacak gibi.
            // router.replace('/(tabs)'); // Ana tab ekranına git
          },
        },
      ]
    );
  };

  const handleShowBookCount = async () => {
    const books = await getAllBooks();
    Alert.alert("Kitap Sayısı", `Şu anda kitaplığınızda ${books.length} adet kitap bulunmaktadır.`);
  };


  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Ayarlar' }} />
      <ThemedText type="title" style={styles.title}>Ayarlar</ThemedText>

      <View style={styles.settingItem}>
        <ThemedText style={styles.settingText}>Uygulama Sürümü: 1.0.0</ThemedText>
      </View>

      <View style={styles.settingItem}>
        <RNButton
            title="Kitap Sayısını Göster"
            onPress={handleShowBookCount}
            color={Colors[colorScheme ?? 'light'].tint}
        />
      </View>

      <View style={styles.settingItem}>
        <RNButton
            title="Tüm Kitaplık Verilerini Sil (Tehlikeli)"
            onPress={handleClearAllData}
            color="red" // Dikkat çekici bir renk
        />
      </View>

      {/* Geri butonu (isteğe bağlı, header'da zaten var) */}
      {/*
      <View style={styles.settingItem}>
        <RNButton
            title="Geri Dön"
            onPress={() => router.back()}
            color={Colors[colorScheme ?? 'light'].icon}
        />
      </View>
      */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // alignItems: 'center', // İçerikleri sola yaslamak için kaldırabiliriz
  },
  title: {
    marginBottom: 30,
    textAlign: 'center',
  },
  settingItem: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Temaya göre ayarlanabilir
  },
  settingText: {
    fontSize: 16,
  },
});