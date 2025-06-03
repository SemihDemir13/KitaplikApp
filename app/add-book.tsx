// C:/Users/yunus/KitapligimApp/app/add-book.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button as RNButton,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  FlatList, // Arama sonuçları için
  TouchableOpacity, // Arama sonuçları için
  ActivityIndicator, // Arama sırasında göstermek için
  Image, // Arama sonuçlarında kapak resmi için
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios'; // axios importu

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { addBook } from '@/services/bookStorage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Book } from '@/types/Book'; // Book tipini kullanabiliriz

// Google Books API'den gelen sonuçlar için bir tip tanımlayalım
interface GoogleBookVolumeInfo {
  title?: string;
  authors?: string[];
  pageCount?: number;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  industryIdentifiers?: Array<{ type: string; identifier: string }>;
  description?: string; // İleride kullanılabilir
}

interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export default function AddBookScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isbn, setIsbn] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // API'den gelen verilerle formu doldurma
  const populateFormWithApiData = (bookItem: GoogleBookItem) => {
    const volumeInfo = bookItem.volumeInfo;
    setTitle(volumeInfo.title || '');
    setAuthor(volumeInfo.authors ? volumeInfo.authors.join(', ') : '');
    setTotalPages(volumeInfo.pageCount ? volumeInfo.pageCount.toString() : '');
    setCoverImageUrl(volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '');

    const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    setIsbn(isbn13 || isbn10 || '');

    setSearchResults([]); // Arama sonuçlarını temizle
    setSearchTerm(''); // Arama çubuğunu temizle
  };

  const handleSearchBooks = async () => {
    if (!searchTerm.trim()) {
      Alert.alert("Arama Terimi Yok", "Lütfen aramak için bir kitap adı veya ISBN girin.");
      return;
    }
    setIsSearching(true);
    setApiError(null);
    setSearchResults([]);
    console.log(`[AddBookScreen] Google Books API aranıyor: ${searchTerm}`);

    try {
      // Google Books API'ye GET isteği
      // API anahtarı gerekebilir, ancak basit aramalar genellikle anahtarsız çalışır.
      // Eğer sorun yaşarsanız, Google Cloud Console'dan bir API anahtarı alıp
      // &key=YOUR_API_KEY şeklinde URL'ye eklemeniz gerekebilir.
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=10`);

      if (response.data && response.data.items) {
        setSearchResults(response.data.items);
        console.log(`[AddBookScreen] ${response.data.items.length} sonuç bulundu.`);
      } else {
        setSearchResults([]);
        console.log(`[AddBookScreen] Sonuç bulunamadı.`);
        setApiError("Bu arama için sonuç bulunamadı.");
      }
    } catch (error) {
      console.error("[AddBookScreen] Google Books API hatası:", error);
      setApiError("Kitaplar aranırken bir hata oluştu. İnternet bağlantınızı kontrol edin.");
      Alert.alert("API Hatası", "Kitaplar aranırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveBook = async () => {
    // ... (Bu fonksiyon bir önceki mesajdaki gibi kalabilir, sadece
    // addBook'a gönderilen objenin doğru alanları içerdiğinden emin olun) ...
    if (!title.trim() || !author.trim() || !totalPages.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen başlık, yazar ve sayfa sayısı alanlarını doldurun.');
      return;
    }
    const numTotalPages = parseInt(totalPages, 10);
    if (isNaN(numTotalPages) || numTotalPages <= 0) {
      Alert.alert('Geçersiz Giriş', 'Sayfa sayısı geçerli bir pozitif sayı olmalıdır.');
      return;
    }
    try {
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        totalPages: numTotalPages,
        coverImageUrl: coverImageUrl.trim() || undefined,
        isbn: isbn.trim() || undefined,
      };
      const newBook = await addBook(bookData); // addBook'a gönderilen parametreleri kontrol edin
      if (newBook) {
        Alert.alert('Başarılı', `"${newBook.title}" adlı kitap eklendi!`);
        router.back();
      } else {
        Alert.alert('Hata', 'Kitap eklenirken bir sorun oluştu.');
      }
    } catch (error) {
      console.error("Kitap kaydetme hatası:", error);
      Alert.alert('Sistem Hatası', 'Kitap eklenirken beklenmedik bir sorun oluştu.');
    }
  };

  const inputStyle = { /* ... (önceki gibi) ... */ };

  return (
    <ThemedView style={styles.outerContainer}>
      <Stack.Screen options={{ title: 'Yeni Kitap Ekle' }} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={styles.pageTitle}>Yeni Kitap Ekle</ThemedText>

        {/* Arama Bölümü */}
        <View style={styles.searchSection}>
          <ThemedText style={styles.label}>Kitap Ara (Google Books):</ThemedText>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, inputStyle, styles.searchInput]}
              placeholder="Kitap adı veya ISBN..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={handleSearchBooks} // Enter'a basınca ara
            />
            <RNButton title="Ara" onPress={handleSearchBooks} color={Colors[colorScheme ?? 'light'].tint} disabled={isSearching} />
          </View>
          {isSearching && <ActivityIndicator style={{ marginVertical: 10 }} size="small" color={Colors[colorScheme ?? 'light'].tint} />}
          {apiError && <ThemedText style={styles.errorText}>{apiError}</ThemedText>}
        </View>

        {/* Arama Sonuçları */}
        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => populateFormWithApiData(item)} style={styles.searchResultItem}>
                {item.volumeInfo.imageLinks?.smallThumbnail && (
                  <Image source={{ uri: item.volumeInfo.imageLinks.smallThumbnail }} style={styles.searchResultCover} />
                )}
                <View style={styles.searchResultInfo}>
                  <ThemedText type="defaultSemiBold" numberOfLines={2}>{item.volumeInfo.title}</ThemedText>
                  <ThemedText style={styles.searchResultAuthor} numberOfLines={1}>{item.volumeInfo.authors?.join(', ')}</ThemedText>
                </View>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        )}

        {/* Form Alanları */}
        <ThemedText style={[styles.label, styles.formFieldsTitle]}>Kitap Bilgileri</ThemedText>
        {/* ... (title, author, totalPages, coverImageUrl, isbn için TextInput'lar önceki gibi) ... */}
        {/* Örnek bir tanesi: */}
        <ThemedText style={styles.label}>Kitap Başlığı:</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Örn: Sefiller"
          value={title}
          onChangeText={setTitle}
        />
        {/* Diğer TextInput'ları da aynı şekilde ekleyin */}
         <ThemedText style={styles.label}>Yazar Adı:</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Örn: Victor Hugo"
          value={author}
          onChangeText={setAuthor}
        />
        <ThemedText style={styles.label}>Toplam Sayfa Sayısı:</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Örn: 350"
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="number-pad"
        />
        <ThemedText style={styles.label}>Kapak Resmi URL'si (İsteğe Bağlı):</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="https://ornek.com/kapak.jpg"
          value={coverImageUrl}
          onChangeText={setCoverImageUrl}
          autoCapitalize="none"
        />
        <ThemedText style={styles.label}>ISBN (İsteğe Bağlı):</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="978-3-16-148410-0"
          value={isbn}
          onChangeText={setIsbn}
        />


        <View style={styles.buttonContainer}>
          <RNButton title="Kaydet" onPress={handleSaveBook} color={Colors[colorScheme ?? 'light'].tint} />
        </View>
        <View style={styles.buttonContainer}>
          <RNButton title="İptal Et / Formu Temizle" onPress={() => {
            // Formu temizle veya geri git
            setTitle(''); setAuthor(''); setTotalPages(''); setCoverImageUrl(''); setIsbn('');
            setSearchTerm(''); setSearchResults([]); setApiError(null);
            // router.back(); // Ya da direkt geri git
          }} color={Colors[colorScheme ?? 'light'].icon} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  scrollContainer: { flexGrow: 1, alignItems: 'center', padding: 15, paddingBottom: 30 },
  pageTitle: { marginBottom: 20, textAlign: 'center' },
  searchSection: { width: '100%', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  searchRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  searchInput: { flex: 1, marginRight: 10 },
  searchResultsList: { maxHeight: 200, width: '100%', marginBottom: 20, borderWidth:1, borderColor:'#ddd', borderRadius: 8 },
  searchResultItem: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  searchResultCover: { width: 40, height: 60, marginRight: 10, borderRadius: 4 },
  searchResultInfo: { flex: 1 },
  searchResultAuthor: { fontSize: 12, color: '#666', marginTop: 2 },
  formFieldsTitle: { alignSelf: 'flex-start', fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10, width: '90%', marginLeft: '5%'},
  label: { alignSelf: 'flex-start', marginLeft: '5%', marginBottom: 4, fontSize: 14, fontWeight: '500' },
  input: { width: '90%', height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 15, fontSize: 16, alignSelf: 'center' },
  buttonContainer: { width: '90%', marginTop: 8, alignSelf: 'center' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 5 },
  // inputStyle (dinamik) için styles.input'a ek olarak renkleri belirleyebilirsiniz
});