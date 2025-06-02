// C:/Users/yunus/KitapligimApp/src/types/Book.ts
export interface Book {
  id: string; // Benzersiz ID
  title: string;
  author: string;
  totalPages: number;
  currentPage?: number; // Okunan sayfa sayısı
  status?: 'to-read' | 'reading' | 'read'; // Okuma durumu
  rating?: number; // 0-5 yıldız
  notes?: string; // Kitapla ilgili notlar
  coverImageUrl?: string; // Kitap kapağı URL'si (isteğe bağlı)
  addedDate: string; // Eklendiği tarih (ISOString formatında)
  isbn?: string; // API araması için (isteğe bağlı)
}