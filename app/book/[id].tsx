// C:/Users/yunus/KitapligimApp/app/book/[id].tsx

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Button as RNButton,
  Alert,
  Image,
  Platform,
  
  TouchableOpacity, // Picker yerine basit butonlar için
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
// Picker için alternatif: npm install @react-native-picker/picker
// import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Book } from '@/types/Book';
import { getBookById, updateBook, deleteBook } from '@/services/bookStorage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Opsiyonel: Yıldızlı puanlama için (3rd party kütüphane kullanımı isterini karşılar)
// npx expo install react-native-ratings
// import { Rating } from 'react-native-ratings';

export default function BookDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>(); // URL'den kitap ID'sini al

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false); // Not düzenleme modu için
  const [editedNotes, setEditedNotes] = useState('');
  const [editedStatus, setEditedStatus] = useState<Book['status'] | undefined>(undefined);
  const [editedRating, setEditedRating] = useState<Book['rating'] | undefined>(undefined);


  const fetchBookDetails = useCallback(async () => {
    if (!id) {
      Alert.alert("Hata", "Kitap ID'si bulunamadı.");
      router.back();
      return;
    }
    console.log(`[BookDetailScreen] fetchBookDetails çağrıldı, ID: ${id}`);
    setIsLoading(true);
    try {
      const fetchedBook = await getBookById(id);
      if (fetchedBook) {
        setBook(fetchedBook);
        setEditedNotes(fetchedBook.notes || '');
        setEditedStatus(fetchedBook.status || 'to-read');
        setEditedRating(fetchedBook.rating || 0);
      } else {
        Alert.alert("Hata", "Kitap bulunamadı.");
        router.back();
      }
    } catch (error) {
      console.error("Kitap detayları yüklenirken hata:", error);
      Alert.alert("Hata", "Kitap detayları yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]); // id ve router bağımlılıklara eklendi

  useFocusEffect(
    useCallback(() => {
      fetchBookDetails();
    }, [fetchBookDetails])
  );


  const handleUpdateBook = async (field: keyof Omit<Book, 'id' | 'addedDate'>, value: any) => {
    if (!book) return;
    console.log(`[BookDetailScreen] Kitap güncelleniyor. Alan: ${field}, Değer: ${value}`);
    try {
      const success = await updateBook(book.id, { [field]: value });
      if (success) {
        // Alert.alert("Başarılı", "Kitap güncellendi.");
        setBook(prevBook => prevBook ? { ...prevBook, [field]: value } : null); // Lokal state'i de güncelle
        if (field === 'notes') setIsEditingNotes(false);
      } else {
        Alert.alert("Hata", "Kitap güncellenemedi.");
      }
    } catch (error) {
      Alert.alert("Hata", "Güncelleme sırasında bir sorun oluştu.");
    }
  };

  const handleSaveNotes = () => {
    handleUpdateBook('notes', editedNotes);
  };

  const handleDelete = () => {
    if (!book) return;
    Alert.alert(
      "Kitabı Sil",
      `"${book.title}" adlı kitabı silmek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const success = await deleteBook(book.id);
            if (success) {
              Alert.alert("Başarılı", "Kitap silindi.");
              router.replace('/(tabs)'); // Ana ekrana (Kitaplığım'a) yönlendir ve geçmişi temizle
            } else {
              Alert.alert("Hata", "Kitap silinirken bir sorun oluştu.");
            }
          },
        },
      ]
    );
  };

  // Rating için basit butonlar (react-native-ratings yerine)
  const renderRatingButtons = () => {
    if (!book) return null; // book state'ini kontrol edelim
    const currentRating = editedRating || 0; // editedRating undefined ise 0 kabul et
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isSelected = i <= currentRating; // DÜZELTME: i, mevcut rating'e eşit veya küçükse seçili
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => {
            const newRating = i === currentRating ? 0 : i; // Aynı yıldıza tekrar tıklanırsa puanı sıfırla (isteğe bağlı)
            setEditedRating(newRating);
            handleUpdateBook('rating', newRating);
          }}
          style={[
            styles.starButton,
            // isSelected && styles.starButtonSelected // starButtonSelected stilini şimdilik kullanmayalım, sadece renk değişimi yeterli olabilir
          ]}
        >
          <ThemedText style={isSelected ? styles.starSelectedText : styles.starText}>
            ★
          </ThemedText>
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };


  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText>Kitap detayları yükleniyor...</ThemedText>
      </ThemedView>
    );
  }

  if (!book) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Kitap bulunamadı.</ThemedText>
      </ThemedView>
    );
  }

  const inputStyle = {
    borderColor: Colors[colorScheme ?? 'light'].icon,
    color: Colors[colorScheme ?? 'light'].text,
  };

  return (
    <ThemedView style={styles.outerContainer}>
      <Stack.Screen options={{ title: book.title || 'Kitap Detayı' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {book.coverImageUrl ? (
          <Image source={{ uri: book.coverImageUrl }} style={styles.coverImage} resizeMode="contain" />
        ) : (
          <View style={[styles.coverImagePlaceholder, {backgroundColor: Colors[colorScheme ?? 'light'].icon + '20'}]}>
            <ThemedText>Kapak Yok</ThemedText>
          </View>
        )}

        <ThemedText type="title" style={styles.title}>{book.title}</ThemedText>
        <ThemedText type="subtitle" style={styles.author}>Yazar: {book.author}</ThemedText>
        <ThemedText style={styles.detailText}>Sayfa Sayısı: {book.totalPages}</ThemedText>
        <ThemedText style={styles.detailText}>Eklenme Tarihi: {new Date(book.addedDate).toLocaleDateString()}</ThemedText>
        {book.isbn && <ThemedText style={styles.detailText}>ISBN: {book.isbn}</ThemedText>}

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Okuma Durumu:</ThemedText>
          {/* Picker yerine basit butonlar kullanalım */}
          <View style={styles.statusContainer}>
            {(['to-read', 'reading', 'read'] as const).map((statusValue) => (
              <TouchableOpacity
                key={statusValue}
                style={[styles.statusButton, editedStatus === statusValue && styles.statusButtonSelected]}
                onPress={() => {
                  setEditedStatus(statusValue);
                  handleUpdateBook('status', statusValue);
                }}
              >
                <ThemedText style={editedStatus === statusValue ? styles.statusButtonSelectedText : styles.statusButtonText}>
                  {statusValue === 'to-read' ? 'Okunacak' : statusValue === 'reading' ? 'Okunuyor' : 'Okundu'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Puanınız:</ThemedText>
          {renderRatingButtons()}
          {/* 
          react-native-ratings kullanacaksanız:
          <Rating
            type="star"
            ratingCount={5}
            imageSize={30}
            startingValue={editedRating}
            onFinishRating={(rating) => {
              setEditedRating(rating);
              handleUpdateBook('rating', rating);
            }}
            tintColor={Colors[colorScheme ?? 'light'].background} // Arka plan rengine göre ayarla
            style={{ paddingVertical: 10 }}
          />
          */}
          
        </View>

        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Notlar:</ThemedText>
          {isEditingNotes ? (
            <>
              <TextInput
                style={[styles.notesInput, inputStyle]}
                value={editedNotes}
                onChangeText={setEditedNotes}
                multiline
                numberOfLines={4}
                placeholder="Kitapla ilgili notlarınız..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              />
              <RNButton title="Notları Kaydet" onPress={handleSaveNotes} color={Colors[colorScheme ?? 'light'].tint}/>
              <View style={{marginTop: 5}}>
                <RNButton title="İptal" onPress={() => {
                  setIsEditingNotes(false);
                  setEditedNotes(book.notes || ''); // Değişiklikleri geri al
                }} color={Colors[colorScheme ?? 'light'].icon}/>
              </View>
            </>
          ) : (
            <>
              <ThemedText style={styles.notesText}>{editedNotes || "Henüz not eklenmemiş."}</ThemedText>
              <RNButton title="Notları Düzenle" onPress={() => setIsEditingNotes(true)} />
            </>
          )}
        </View>

        <View style={styles.deleteButtonContainer}>
          <RNButton title="Bu Kitabı Sil" onPress={handleDelete} color="red" />
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
    padding: 20,
    paddingBottom: 40, // ScrollView için altta boşluk
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '80%',
    height: 300, // Veya aspectRatio kullanın
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 8,
  },
  coverImagePlaceholder: {
    width: '80%',
    height: 300,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 18,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee', // Temaya göre ayarlanabilir
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.tint, // Temaya göre ayarla
  },
  statusButtonSelected: {
    backgroundColor: Colors.light.tint, // Temaya göre ayarla
  },
  statusButtonText: {
    // color: Colors.light.tint // Temaya göre ayarla (ThemedText zaten yapar)
  },
  statusButtonSelectedText: {
    color: '#fff', // Temaya göre ayarla
    fontWeight: 'bold',
  },
  ratingContainer: {
   flexDirection: 'row',
    justifyContent: 'center', // Yıldızları yatayda ortala
    alignItems: 'center',    // Yıldızları dikeyde ortala (TouchableOpacity'leri hizalar)
    marginVertical: 10,
    
      //   backgroundColor: 'lightpink', // DEBUG: Alanı görmek için

  },
  starButton: {
   paddingHorizontal: 5, // Yıldızlar arası boşluğu biraz azalttık
    // paddingVertical: 5, // Dikey padding'i buradan kaldırıp doğrudan Text'e verebiliriz veya aynı tutabiliriz
    alignItems: 'center',   // Yıldız Text'ini kendi içinde ortalamak için
    justifyContent: 'center', // Yıldız Text'ini kendi içinde ortalamak için
  },
 starButtonSelected: { // <<< YENİ EKLENEN STİL
    // Seçili yıldıza özel bir stil ekleyebilirsiniz, örneğin arka plan veya border
    // Şimdilik sadece metin rengini starSelectedText ile değiştirdiğimiz için
    // burası boş kalabilir veya ince bir border eklenebilir.
    // Örneğin:
    // borderRadius: 5,
    // backgroundColor: 'rgba(255, 215, 0, 0.2)', // Hafif sarı arka plan
  },
  starText: {
   fontSize: 36, // Boyutları eşitleyelim
    lineHeight: 38, // Boyutları eşitleyelim (fontSize'dan biraz büyük olabilir)
    color:'gray',
    textAlign: 'center', // Ekstra hizalama
  },
  starSelectedText: {
    fontSize: 36, // Boyutları eşitleyelim
    lineHeight: 38, // Boyutları eşitleyelim (fontSize'dan biraz büyük olabilir)
    color: '#FFC107', // Daha canlı bir sarı
    textAlign: 'center', // Ekstra hizalama
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top', // Android için
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 50,
    marginBottom: 10,
    fontStyle: 'italic', // Not yoksa veya varsa stil
  },
  deleteButtonContainer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
});