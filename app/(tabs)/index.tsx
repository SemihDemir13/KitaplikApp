// C:/Users/yunus/KitapligimApp/app/(tabs)/index.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button as RNButton, // RNButton olarak yeniden adlandırdık
  TouchableOpacity,
  Alert,
  Image, // Kapak resmi için
} from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router'; // Stack'i sildik, _layout.tsx'de handle ediliyor

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/types/Book';
import { getAllBooks, deleteBook } from '@/services/bookStorage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// Opsiyonel: Eğer @expo/vector-icons'tan bir silme ikonu kullanmak isterseniz
// import { MaterialIcons } from '@expo/vector-icons';

export default function BookListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedBooks = await getAllBooks();
      // Kitapları eklenme tarihine göre yeniden eskiye sıralayalım
      fetchedBooks.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
      setBooks(fetchedBooks);
    } catch (error) {
      console.error("Kitaplar yüklenirken hata oluştu:", error);
      Alert.alert("Hata", "Kitaplar yüklenemedi. Lütfen uygulamayı yeniden başlatmayı deneyin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ekran her odaklandığında kitapları yeniden yükle
  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [fetchBooks])
  );

  const handleDeleteBook = (id: string, title: string) => {
    Alert.alert(
      "Kitabı Sil",
      `"${title}" adlı kitabı silmek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteBook(id);
            if (success) {
              Alert.alert("Başarılı", `"${title}" adlı kitap silindi.`);
              fetchBooks(); // Listeyi yenile
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
        {/* <MaterialIcons name="delete-outline" size={24} color={Colors.light.tint} /> */}
        <ThemedText style={{ color: Colors[colorScheme ?? 'light'].tint, fontSize: 14 }}>Sil</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={{ marginTop: 10 }}>Kitaplar yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header başlığı app/(tabs)/_layout.tsx dosyasından geliyor */}
      {/* <Stack.Screen options={{ title: 'Kitaplığım' }} /> Bu satıra gerek yok */}

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
          ListHeaderComponent={ // Kitap sayısı ve ekleme butonu için bir başlık alanı
            <View style={styles.listHeader}>
              <ThemedText>Toplam {books.length} kitap</ThemedText>
            </View>
          }
        />
      )}

      {/* "Yeni Kitap Ekle" Butonu ekranın altında sabit */}
      <View style={styles.addButtonContainer}>
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
    borderBottomColor: '#eee', // Temaya göre ayarlanabilir
    marginBottom: 5,
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 70, // Alttaki buton için yeterli boşluk bırak
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
    color: '#888', // Temaya göre ayarlanabilir
    textAlign: 'center',
  },
  bookItemOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent', // ThemedView'dan alacak
    marginVertical: 6,
    marginHorizontal: 6, // Kenarlardan biraz boşluk
    borderRadius: 12,
    borderWidth: 1,
    // iOS için gölge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // Android için gölge
    elevation: 3,
  },
  bookItemTouchable: {
    flex: 1, // Sil butonuna yer bırakmak için
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 12,
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
    flex: 1, // Yazıların sığması için
  },
  bookTitle: {
    fontSize: 17,
    // fontWeight: 'bold', // type="defaultSemiBold" zaten kalın yapıyor
  },
  bookAuthor: {
    fontSize: 14,
    // color: '#555', // ThemedText kendi rengini ayarlar
    marginTop: 2,
  },
  bookPages: {
    fontSize: 12,
    // color: '#777', // ThemedText kendi rengini ayarlar
    marginTop: 4,
  },
  deleteButton: {
    padding: 15, // Dokunma alanını artır
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 15, // Tab bar'a çok yakın olmaması için biraz yukarı
    left: 20,
    right: 20,
    paddingVertical: 5, // Buttonun kendi iç boşluğu varsa bu azaltılabilir
  },
});