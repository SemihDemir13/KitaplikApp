// C:/Users/yunus/KitapligimApp/app/(tabs)/index.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button as RNButton,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  Platform,
  SafeAreaView, // SafeAreaView eklendi
} from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'; // Tab Bar yüksekliği için

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/types/Book';
import { getAllBooks, deleteBook } from '@/services/bookStorage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Buton ve liste alt boşluğu için yaklaşık değerler
const ADD_BUTTON_AREA_MIN_HEIGHT = 70; // Buton alanının minimum yüksekliği (paddingler dahil)
const EXTRA_BOTTOM_PADDING_FOR_LIST = 10; // Listenin butonun biraz daha üzerinde bitmesi için

export default function BookListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  const loadBooks = useCallback(async (isRefresh = false) => {
    console.log(`[loadBooks] çağrıldı. isRefresh: ${isRefresh}`);
    if (!isRefresh && books.length === 0) {
      setIsLoading(true);
    } else if (isRefresh) {
      setIsRefreshing(true);
    }
    try {
      const fetchedBooks = await getAllBooks();
      fetchedBooks.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
      setBooks(fetchedBooks);
    } catch (error) {
      console.error("[loadBooks] Kitaplar yüklenirken hata oluştu:", error);
      Alert.alert("Hata", "Kitaplar yüklenemedi.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [books.length]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoading) { // Sadece ilk yükleme bittiyse tekrar yükle
        loadBooks();
      }
    }, [isLoading, loadBooks])
  );

  const onRefresh = useCallback(() => {
    loadBooks(true);
  }, [loadBooks]);

  const handleDeleteBook = (id: string, title: string) => {
    Alert.alert(
      "Kitabı Sil",
      `"${title}" adlı kitabı silmek istediğinizden emin misiniz?`,
      // ... (Alert içeriği önceki gibi)
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteBook(id);
            if (success) {
              Alert.alert("Başarılı", `"${title}" adlı kitap silindi.`);
              loadBooks();
            } else {
              Alert.alert("Hata", "Kitap silinirken bir sorun oluştu.");
            }
          },
        },
      ]
    );
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <ThemedView style={[styles.bookItemOuterContainer, { borderColor: Colors[colorScheme ?? 'light'].icon + '30' }]}>
      <TouchableOpacity
        style={styles.bookItemTouchable}
        onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.id } })}
      >
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} style={styles.bookCover} resizeMode="cover" />
        ) : (
          <View style={[styles.bookCoverPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].icon + '20'}]}>
            <ThemedText style={styles.bookCoverPlaceholderText}>Kapak Yok</ThemedText>
          </View>
        )}
        <View style={styles.bookInfo}>
          <ThemedText type="defaultSemiBold" style={styles.bookTitle} numberOfLines={2}>{item.title}</ThemedText>
          <ThemedText style={styles.bookAuthor} numberOfLines={1}>{item.author}</ThemedText>
          <ThemedText style={styles.bookPages}>{item.totalPages} sayfa</ThemedText>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteBook(item.id, item.title)} style={styles.deleteButton}>
        <ThemedText style={{ color: Colors[colorScheme ?? 'light'].tint, fontSize: 14 }}>Sil</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  // FlatList için contentContainerStyle'ı dinamik olarak hesapla
  const listContentContainerStyle = useMemo(() => ({
    paddingHorizontal: 10,
    // Listenin en altına, tab bar + buton alanı + ekstra boşluk kadar padding ekliyoruz.
    // Bu, listenin son elemanının butonun arkasında kalmamasını sağlar.
    paddingBottom: tabBarHeight + ADD_BUTTON_AREA_MIN_HEIGHT + EXTRA_BOTTOM_PADDING_FOR_LIST,
  }), [tabBarHeight]);

  if (isLoading) { // isLoading true iken her zaman yükleme ekranını göster
    return (
      <ThemedView style={styles.centeredFullScreen}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 10 }}>Kitaplar yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/* Liste veya Boş Liste Mesajı */}
        <View style={styles.listContainer}>
          {books.length === 0 ? (
            <ThemedView style={styles.centeredInList}>
              <ThemedText style={styles.emptyText}>Kitaplığınızda hiç kitap bulunmuyor.</ThemedText>
              <ThemedText style={styles.emptySubText}>Başlamak için yeni bir kitap ekleyin!</ThemedText>
            </ThemedView>
          ) : (
            <FlatList
              data={books}
              renderItem={renderBookItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={listContentContainerStyle} // DİNAMİK STİL
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <ThemedText>Toplam {books.length} kitap</ThemedText>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors[colorScheme ?? 'light'].tint}
                  colors={[Colors[colorScheme ?? 'light'].tint]}
                />
              }
            />
          )}
        </View>

        {/* "Yeni Kitap Ekle" Butonu Alanı */}
        <View style={[styles.addButtonArea, { paddingBottom: tabBarHeight + (Platform.OS === 'ios' ? 5 : 10) }]}>
          <Link href="/add-book" asChild>
            <RNButton title="Yeni Kitap Ekle" color={Colors[colorScheme ?? 'light'].tint} />
          </Link>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background, // Veya temanıza uygun bir renk
  },
  container: {
    flex: 1,
    // justifyContent: 'space-between', // Bu flex dağılımını bozabilir
  },
  listContainer: { // FlatList veya boş liste mesajını içeren alan
    flex: 1, // Kendine ayrılan (buton hariç) tüm alanı kaplar
  },
  centeredFullScreen: { // Tam ekran ortalama (ana yükleme)
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredInList: { // listContainer içinde ortalama (boş liste mesajı)
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 5,
  },
  // listContentContainer artık useMemo ile dinamik olarak oluşturuluyor.
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  addButtonArea: { // Butonun bulunduğu en alt alan
    paddingHorizontal: 20,
    paddingTop: 10, // Butonun üstünde boşluk
    // paddingBottom dinamik olarak tabBarHeight'e göre veriliyor
    borderTopWidth: 1,
    borderTopColor: Colors.light.icon + '30', // Temaya göre
    // backgroundColor: Colors.light.background, // ThemedView zaten sağlar ama emin olmak için eklenebilir
  },
  // Kitap öğesi stilleri (önceki gibi kalabilir)
  bookItemOuterContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
    marginVertical: 6, marginHorizontal: 6, borderRadius: 12, borderWidth: 1,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  bookItemTouchable: {
    flex: 1, flexDirection: 'row', padding: 12, alignItems: 'center',
  },
  bookCover: {
    width: 60, height: 90, borderRadius: 4, marginRight: 12, backgroundColor: '#e0e0e0',
  },
  bookCoverPlaceholder: {
    width: 60, height: 90, borderRadius: 4, marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  bookCoverPlaceholderText: { fontSize: 10, textAlign: 'center' },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 17 },
  bookAuthor: { fontSize: 14, marginTop: 2 },
  bookPages: { fontSize: 12, marginTop: 4 },
  deleteButton: {
    paddingHorizontal: 15, paddingVertical: 20,
    justifyContent: 'center', alignItems: 'center',
  },
});