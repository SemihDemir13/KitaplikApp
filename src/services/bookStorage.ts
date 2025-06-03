// C:/Users/yunus/KitapligimApp/src/services/bookStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '@/types/Book'; // src/types/Book.ts dosyamızdan
import 'react-native-get-random-values'; // uuid için gerekli olabilir (proje başına bir kez import yeterli)
import { v4 as uuidv4 } from 'uuid';

const BOOKS_STORAGE_KEY = '@KitapligimApp:books';

// Tüm kitapları getiren fonksiyon
export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Kitaplar okunurken hata oluştu:", e);
    return [];
  }
};

// ID'ye göre belirli bir kitabı getiren fonksiyon
export const getBookById = async (id: string): Promise<Book | null> => {
  try {
    const books = await getAllBooks();
    const book = books.find(b => b.id === id);
    return book || null;
  } catch (e) {
    console.error("ID ile kitap okunurken hata oluştu:", e);
    return null;
  }
};

// Yeni kitap ekleyen fonksiyon
export const addBook = async (bookData: Omit<Book, 'id' | 'addedDate' | 'currentPage' | 'status' | 'rating' | 'notes'> & { totalPages: number }): Promise<Book | null> => {
  try {
    const currentBooks = await getAllBooks();
    const newBook: Book = {
      ...bookData,
      id: uuidv4(),
      addedDate: new Date().toISOString(),
      currentPage: 0,
      status: 'to-read',
      rating: 0,
      notes: '',
      coverImageUrl: bookData.coverImageUrl || '', // Eğer undefined ise boş string ata
      isbn: bookData.isbn || '', // Eğer undefined ise boş string ata
    };
    currentBooks.push(newBook);
    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(currentBooks));
    return newBook;
  } catch (e) {
    console.error("Kitap eklenirken hata oluştu:", e);
    return null;
  }
};

// Bir kitabı güncelleyen fonksiyon
export const updateBook = async (id: string, updatedData: Partial<Omit<Book, 'id' | 'addedDate'>>): Promise<Book | null> => {
  try {
    let books = await getAllBooks();
    const bookIndex = books.findIndex(book => book.id === id);

    if (bookIndex === -1) {
      console.error("Güncellenecek kitap bulunamadı, ID:", id);
      return null;
    }

    // Mevcut kitabı ve güncellenmiş verileri birleştir
    books[bookIndex] = { ...books[bookIndex], ...updatedData };

    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
    return books[bookIndex];
  } catch (e) {
    console.error("Kitap güncellenirken hata oluştu:", e);
    return null;
  }
};

// Bir kitabı silen fonksiyon
// src/services/bookStorage.ts

// ... (diğer importlar ve fonksiyonlar) ...

export const deleteBook = async (id: string): Promise<boolean> => {
      console.log(`deleteBook çağrıldı, ID: ${id}`); // <<-- EKLENECEK LOG

  try {
    let books = await getAllBooks();
    const initialLength = books.length;
    const updatedBooks = books.filter(book => book.id !== id); // ID'si eşleşmeyeni filtrele

    // Eğer hiçbir kitap silinmediyse (ID bulunamadıysa), yine de başarılı sayabiliriz veya false dönebiliriz.
    // Genellikle, ID bulunamasa bile işlem "başarılı"dır çünkü sonuçta o ID'li kitap artık listede yoktur.
    // Ama gerçekten bir silme olup olmadığını kontrol etmek isterseniz:
    if (updatedBooks.length === initialLength) {
      console.warn(`Silinecek kitap bulunamadı, ID: ${id}`);
      // return false; // Eğer ID bulunamadığında hata olarak kabul etmek isterseniz.
                     // Ancak genellikle bu durum bir hata değildir. Kullanıcı arayüzünde
                     // zaten olmayan bir şeyi silmeye çalışıyor olabilir.
    }

    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(updatedBooks));
    console.log(`Kitap silindi (veya bulunamadı): ${id}, kalan kitap sayısı: ${updatedBooks.length}`);
    return true; // Her durumda (bulunamasa bile) true dönmek genellikle UI için daha basittir.
  } catch (e) {
    console.error("Kitap silinirken hata oluştu:", e);
    return false;
  }
};

// (İsteğe bağlı) Tüm kitapları silmek için (test amaçlı)
export const clearAllBooks = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BOOKS_STORAGE_KEY);
    console.log("Tüm kitaplar silindi.");
  } catch (e) {
    console.error("Tüm kitaplar silinirken hata:", e);
  }
};