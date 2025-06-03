// C:/Users/yunus/KitapligimApp/app/(tabs)/index.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button as RNButton,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl, // Pull-to-refresh için eklendi
    Platform,
} from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/types/Book';
import { getAllBooks, deleteBook } from '@/services/bookStorage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'; 


export default function BookListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Pull-to-refresh için state
    const tabBarHeight = useBottomTabBarHeight();


  const loadBooks = useCallback(async (isRefresh = false) => {
    console.log(`[loadBooks] çağrıldı. isRefresh: ${isRefresh}`);
    if (!isRefresh) { // Sadece ilk yüklemede veya focus'ta true yap
      setIsLoading(true);
    } else {
      setIsRefreshing(true); // Pull-to-refresh için
    }

    try {
      const fetchedBooks = await getAllBooks();
      console.log(`[loadBooks] ${fetchedBooks.length} kitap yüklendi.`);
      fetchedBooks.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
      setBooks(fetchedBooks);
    } catch (error) {
      console.error("[loadBooks] Kitaplar yüklenirken hata oluştu:", error);
      Alert.alert("Hata", "Kitaplar yüklenemedi.");
    } finally {
      if (!isRefresh) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
      console.log(`[loadBooks] yükleme tamamlandı.`);
    }
  }, []); // Bağımlılık dizisi boş, çünkü dışarıdan bir şeye bağlı değil, sadece çağrıldığında çalışıyor.

  // Ekran her odaklandığında kitapları yeniden yükle
  useFocusEffect(
    useCallback(() => {
      console.log("[useFocusEffect] Ekran odaklandı, kitaplar yükleniyor...");
      loadBooks(); // loadBooks fonksiyonunu çağırıyoruz
      return () => {
        // İsteğe bağlı: Ekran odaktan çıktığında bir temizleme işlemi
        console.log("[useFocusEffect] Ekran odaktan çıktı.");
      };
    }, [loadBooks]) // loadBooks bağımlılık olarak eklendi
  );

  const onRefresh = useCallback(() => {
    console.log("[onRefresh] Pull-to-refresh tetiklendi.");
    loadBooks(true); // Refresh olduğunu belirt
  }, [loadBooks]); // loadBooks bağımlılık olarak eklendi

  const handleDeleteBook = (id: string, title: string) => {
    console.log(`[handleDeleteBook] Fonksiyon çağrıldı - ID: ${id}, Başlık: ${title}`);
    Alert.alert(
      "Kitabı Sil",
      `"${title}" adlı kitabı silmek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            console.log(`[handleDeleteBook] Alert içindeki Sil'e basıldı - ID: ${id}`);
            const success = await deleteBook(id);
            if (success) {
              Alert.alert("Başarılı", `"${title}" adlı kitap silindi.`);
              loadBooks(); // Listeyi yenilemek için loadBooks'u çağır
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

  if (isLoading && books.length === 0) { // Sadece ilk yüklemede ve hiç kitap yokken göster
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 10 }}>Kitaplar yükleniyor...</ThemedText>
      </ThemedView>
    );
  }
   const dynamicAddButtonContainerStyle = {
    position: 'absolute' as 'absolute', // TypeScript için tip belirtmek gerekebilir
    bottom: tabBarHeight + 10, // Tab bar'ın 10 piksel üzeri
    left: 20,
    right: 20,
    paddingVertical: Platform.OS === 'ios' ? 10 : 5, // iOS'ta biraz daha padding gerekebilir
                                                  // veya RNButton'u View ile sarıp padding'i View'e verin
    zIndex: 1, // Gerekirse
  };

  return (
    <ThemedView style={styles.container}>
      {books.length === 0 && !isLoading ? (
        <ThemedView style={styles.centered}>
          <ThemedText style={styles.emptyText}>Kitaplığınızda hiç kitap bulunmuyor.</ThemedText>
          <ThemedText style={styles.emptySubText}>Başlamak için yeni bir kitap ekleyin!</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <ThemedText>Toplam {books.length} kitap</ThemedText>
            </View>
          }
          refreshControl={ // Pull-to-refresh eklendi
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint} // iOS için
              colors={[Colors[colorScheme ?? 'light'].tint]} // Android için
            />
          }
          // extraData={books} // Genellikle books referansı değiştiği için gerekmez, ama sorun devam ederse denenebilir.
        />
      )}

        <View style={dynamicAddButtonContainerStyle}> {/* DİNAMİK STİLİ KULLANIN */}
        <Link href="/add-book" asChild>
          <RNButton title="Yeni Kitap Ekle" color={Colors[colorScheme ?? 'light'].tint} />
        </Link>
      </View>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 100, // Buton ve tab bar için daha fazla boşluk
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  bookItemOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginVertical: 6,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Gölgeyi biraz azalttım
    shadowOpacity: 0.08, // Gölgeyi biraz azalttım
    shadowRadius: 2, // Gölgeyi biraz azalttım
    elevation: 2, // Android için gölge
  },
  bookItemTouchable: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 12,
    backgroundColor: '#e0e0e0', // Resim yüklenene kadar placeholder rengi
  },
  bookCoverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverPlaceholderText: {
    fontSize: 10,
    textAlign: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 17,
  },
  bookAuthor: {
    fontSize: 14,
    marginTop: 2,
  },
  bookPages: {
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 15, // Yatayda padding
    paddingVertical: 20,  // Dikeyde padding (tıklama alanını artırmak için)
    justifyContent: 'center',
    alignItems: 'center',
  },
 
});