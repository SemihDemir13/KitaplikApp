// C:/Users/yunus/KitapligimApp/app/add-book.tsx

import React, { useState } from 'react';
import { View, TextInput, Button as RNButton, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { addBook } from '@/services/bookStorage'; // Servisimizi import ediyoruz
import { Colors } from '@/constants/Colors'; // Renkler için
import { useColorScheme } from '@/hooks/useColorScheme';

export default function AddBookScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(''); // İsteğe bağlı kapak URL'si
  const [isbn, setIsbn] = useState(''); // İsteğe bağlı ISBN

  const handleSaveBook = async () => {
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
      // Omit<Book, 'id' | 'addedDate' | ...> tipine uygun bir obje oluşturuyoruz
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        totalPages: numTotalPages,
        coverImageUrl: coverImageUrl.trim() || undefined, // Boşsa undefined gönder
        isbn: isbn.trim() || undefined, // Boşsa undefined gönder
      };

      const newBook = await addBook(bookData);

      if (newBook) {
        Alert.alert('Başarılı', `"${newBook.title}" adlı kitap eklendi!`);
        router.back(); // Bir önceki ekrana (Kitaplığım ekranına) dön
      } else {
        Alert.alert('Hata', 'Kitap eklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error("Kitap kaydetme hatası:", error);
      Alert.alert('Sistem Hatası', 'Kitap eklenirken beklenmedik bir sorun oluştu.');
    }
  };

  const inputStyle = {
    borderColor: Colors[colorScheme ?? 'light'].icon, // Temaya göre border rengi
    color: Colors[colorScheme ?? 'light'].text, // Temaya göre yazı rengi
  };

  return (
    <ThemedView style={styles.outerContainer}>
      <Stack.Screen options={{ title: 'Yeni Kitap Ekle' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title" style={styles.title}>Yeni Kitap Ekle</ThemedText>

        <ThemedText style={styles.label}>Kitap Başlığı:</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Örn: Sefiller"
          placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
          value={title}
          onChangeText={setTitle}
        />

        <ThemedText style={styles.label}>Yazar Adı:</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Örn: Victor Hugo"
          placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
          value={author}
          onChangeText={setAuthor}
        />

        <ThemedText style={styles.label}>Toplam Sayfa Sayısı:</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="Örn: 350"
          placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="number-pad" // Sadece sayı girişi için
        />

        <ThemedText style={styles.label}>Kapak Resmi URL'si (İsteğe Bağlı):</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="https://ornek.com/kapak.jpg"
          placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
          value={coverImageUrl}
          onChangeText={setCoverImageUrl}
          autoCapitalize="none"
        />

        <ThemedText style={styles.label}>ISBN (İsteğe Bağlı):</ThemedText>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholder="978-3-16-148410-0"
          placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
          value={isbn}
          onChangeText={setIsbn}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
        />

        <View style={styles.buttonContainer}>
          <RNButton
            title="Kaydet"
            onPress={handleSaveBook}
            color={Colors[colorScheme ?? 'light'].tint} // Temaya göre buton rengi
          />
        </View>
        <View style={styles.buttonContainer}>
          <RNButton
            title="İptal"
            onPress={() => router.back()}
            color={Colors[colorScheme ?? 'light'].icon} // Temaya göre farklı bir renk
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1, // ScrollView'un içeriği sarması için
    alignItems: 'center', // İçerikleri ortalamak için
    justifyContent: 'center', // İçerikleri dikeyde ortalamak için (ScrollView için contentContainerStyle'da)
    padding: 20,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start', // Etiketleri sola yasla
    marginLeft: '10%', // Input ile hizalamak için (yaklaşık)
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    width: '80%', // Input genişliği
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    width: '80%', // Buton genişliği input ile aynı
    marginTop: 10,
  },
});