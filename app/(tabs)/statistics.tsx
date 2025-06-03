// C:/Users/yunus/KitapligimApp/app/(tabs)/statistics.tsx

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/types/Book';
import { getAllBooks } from '@/services/bookStorage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Stats {
  totalBooks: number;
  readBooks: number;
  readingBooks: number;
  toReadBooks: number;
  totalPagesRead: number;
  averageRating: number | null; // Ortalama puan, hiç puanlanmış kitap yoksa null olabilir
  // İleride eklenebilecekler:
  // favoriteAuthor: string | null;
  // booksPerMonth: number;
}

export default function StatisticsScreen() {
  const colorScheme = useColorScheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateStatistics = useCallback(async (isRefresh = false) => {
    console.log(`[StatisticsScreen] calculateStatistics çağrıldı. isRefresh: ${isRefresh}`);
    if (!isRefresh) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const books = await getAllBooks();
      let totalBooks = books.length;
      let readBooks = 0;
      let readingBooks = 0;
      let toReadBooks = 0;
      let totalPagesRead = 0;
      let totalRating = 0;
      let ratedBookCount = 0;

      books.forEach(book => {
        if (book.status === 'read') {
          readBooks++;
          totalPagesRead += book.totalPages; // Okunan kitapların tüm sayfalarını sayıyoruz
                                            // veya book.currentPage == book.totalPages ise
        } else if (book.status === 'reading') {
          readingBooks++;
          totalPagesRead += book.currentPage || 0; // Okunmakta olanların mevcut sayfasını ekle
        } else {
          toReadBooks++;
        }

        if (book.rating && book.rating > 0) {
          totalRating += book.rating;
          ratedBookCount++;
        }
      });

      const averageRating = ratedBookCount > 0 ? parseFloat((totalRating / ratedBookCount).toFixed(1)) : null;

      setStats({
        totalBooks,
        readBooks,
        readingBooks,
        toReadBooks,
        totalPagesRead,
        averageRating,
      });

    } catch (error) {
      console.error("[StatisticsScreen] İstatistikler hesaplanırken hata:", error);
      // Alert.alert("Hata", "İstatistikler yüklenemedi."); // Kullanıcıya hata göstermek isteğe bağlı
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
      console.log(`[StatisticsScreen] istatistik hesaplama tamamlandı.`);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("[StatisticsScreen] Ekran odaklandı, istatistikler hesaplanıyor...");
      calculateStatistics();
    }, [calculateStatistics])
  );

  const onRefresh = useCallback(() => {
    calculateStatistics(true);
  }, [calculateStatistics]);

  if (isLoading && !stats) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText>İstatistikler yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  if (!stats) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>İstatistik verisi bulunamadı.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.outerContainer}>
      {/* Header başlığı app/(tabs)/_layout.tsx dosyasından geliyor */}
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
            colors={[Colors[colorScheme ?? 'light'].tint]}
          />
        }
      >
        <ThemedText type="title" style={styles.pageTitle}>Okuma İstatistiklerim</ThemedText>

        <View style={styles.gridContainer}>
          <StatCard title="Toplam Kitap" value={stats.totalBooks.toString()} />
          <StatCard title="Okunan Kitap" value={stats.readBooks.toString()} />
          <StatCard title="Okunuyor" value={stats.readingBooks.toString()} />
          <StatCard title="Okunacak" value={stats.toReadBooks.toString()} />
          <StatCard title="Okunan Sayfa" value={stats.totalPagesRead.toString()} />
          <StatCard title="Ortalama Puan" value={stats.averageRating ? `${stats.averageRating} ★` : "N/A"} />
        </View>

        {/* İleride buraya grafikler veya daha detaylı istatistikler eklenebilir */}
        {/* Örneğin: react-native-chart-kit */}

      </ScrollView>
    </ThemedView>
  );
}

// Basit bir istatistik kartı componenti
const StatCard = ({ title, value }: { title: string, value: string }) => {
  const colorScheme = useColorScheme();
  return (
    <ThemedView style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background + 'f0' , borderColor: Colors[colorScheme ?? 'light'].icon + '40'}]}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statTitle}>{title}</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    marginBottom: 25,
    textAlign: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Kartları eşit dağıt
  },
  statCard: {
    width: '45%', // İki kart yan yana sığsın diye (aradaki boşlukla beraber)
    // minHeight: 100, // Kartların minimum yüksekliği
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    // Gölge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
    // color: '#666', // ThemedText kendi rengini ayarlar
  },
});