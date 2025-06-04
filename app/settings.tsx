// C:/Users/yunus/KitapligimApp/app/settings.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Button as RNButton, Alert, Platform, AppState, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { clearAllBooks, getAllBooks } from '@/services/bookStorage'; // Diğer ayarlar için

// Bildirim işleyicisi (uygulama ön plandayken bildirim gelirse ne olacağı)
// Bu, dosyanın en üstünde, component tanımından önce olmalı.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // TypeScript'in son istediği özelliklerle güncelleyelim
    const behavior: Notifications.NotificationBehavior = {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      shouldShowBanner: true, // TypeScript'in bir önceki hatada beklediği
      shouldShowList: true,   // TypeScript'in bir önceki hatada beklediği
    };
    return behavior;
  },
});

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<Notifications.PermissionStatus | undefined>();
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true); // Sadece izin yüklemesi için

  // Mevcut bildirim izin durumunu kontrol etme fonksiyonu
  const checkNotificationPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    console.log('[SettingsScreen] Bildirim izin durumu kontrol ediliyor...');
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionStatus(status);
      console.log('[SettingsScreen] Mevcut bildirim izni:', status);
    } catch (error) {
      console.error("[SettingsScreen] İzinler kontrol edilirken hata:", error);
      setNotificationPermissionStatus(undefined); // Hata durumunda belirsiz bırak
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  // Component ilk yüklendiğinde ve uygulama aktif olduğunda izinleri kontrol et
  useEffect(() => {
    checkNotificationPermissions(); // İlk yüklemede kontrol et

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[SettingsScreen] Uygulama aktif oldu, izinler tekrar kontrol ediliyor.');
        checkNotificationPermissions(); // Uygulama ön plana geldiğinde tekrar kontrol et
      }
    });

    return () => {
      subscription.remove(); // Component unmount olduğunda listener'ı kaldır
    };
  }, [checkNotificationPermissions]);

  // Kullanıcıdan bildirim izni isteme fonksiyonu
  const requestNativePermissions = async () => {
    console.log('[SettingsScreen] Bildirim izni isteniyor...');
    setIsLoadingPermissions(true); // İzin istenirken yükleme göster
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
      setNotificationPermissionStatus(status);

      if (status === 'granted') {
        console.log('[SettingsScreen] Bildirim izni verildi!');
        Alert.alert("İzin Verildi", "Bildirim gönderme izniniz alındı.");
      } else {
        console.log('[SettingsScreen] Bildirim izni verilmedi veya reddedildi.');
        Alert.alert(
          "İzin Sonucu: " + status.toUpperCase(),
          "Bildirim hatırlatıcılarını kullanmak için izin vermeniz gerekmektedir. İzinleri telefonunuzun ayarlarından değiştirebilirsiniz."
        );
      }
    } catch (error) {
      console.error("[SettingsScreen] İzin istenirken hata:", error);
      Alert.alert("Hata", "Bildirim izni istenirken bir sorun oluştu.");
      setNotificationPermissionStatus(undefined); // Hata durumunda belirsiz bırak
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // İzin durumuna göre metin döndüren yardımcı fonksiyon
  const getPermissionStatusText = () => {
    if (notificationPermissionStatus === undefined) {
      return "İzin durumu kontrol ediliyor...";
    }
    switch (notificationPermissionStatus) {
      case Notifications.PermissionStatus.GRANTED:
        return "Bildirimlere izin verildi.";
      case Notifications.PermissionStatus.DENIED:
        return "Bildirimler reddedildi. Telefon ayarlarından değiştirebilirsiniz.";
      case Notifications.PermissionStatus.UNDETERMINED:
        return "Bildirim izni henüz istenmedi veya cevaplanmadı.";
      default:
        return `Bilinmeyen izin durumu: ${notificationPermissionStatus}`;
    }
  };

  // Diğer ayar fonksiyonları
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
            await clearAllBooks();
            Alert.alert("Başarılı", "Tüm kitaplık verileri silindi.");
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
      <ThemedText type="title" style={styles.pageTitle}>Ayarlar</ThemedText>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Bildirim Ayarları</ThemedText>

        <View style={styles.settingItem}>
          <ThemedText style={styles.statusLabel}>Mevcut İzin Durumu:</ThemedText>
          {isLoadingPermissions ? (
            <ActivityIndicator style={{alignSelf: 'flex-start', marginTop: 5}} color={Colors[colorScheme ?? 'light'].text} />
          ) : (
            <ThemedText style={styles.statusText}>{getPermissionStatusText()}</ThemedText>
          )}
        </View>

        {(notificationPermissionStatus === Notifications.PermissionStatus.UNDETERMINED ||
          notificationPermissionStatus === Notifications.PermissionStatus.DENIED) && !isLoadingPermissions && (
          <View style={styles.settingItem}>
            <RNButton
              title={notificationPermissionStatus === Notifications.PermissionStatus.DENIED ? "İzinleri Ayarlardan Değiştir (Bilgi)" : "Bildirim İzni İste"}
              onPress={async () => {
                if (notificationPermissionStatus === Notifications.PermissionStatus.DENIED && Platform.OS !== 'web') {
                  Alert.alert(
                    "İzin Reddedilmiş",
                    "Bildirim izinleri daha önce reddedilmiş. Lütfen telefonunuzun Ayarlar uygulamasından, KitapligimApp için bildirim izinlerini manuel olarak etkinleştirin."
                  );
                } else {
                  await requestNativePermissions();
                }
              }}
              color={Colors[colorScheme ?? 'light'].tint}
            />
          </View>
        )}
        {/* Bildirim planlama/iptal etme butonları ŞİMDİLİK KALDIRILDI */}
      </View>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Veri Yönetimi</ThemedText>
         <View style={styles.settingItem}>
            <RNButton
                title="Kitap Sayısını Göster"
                onPress={handleShowBookCount}
                color={Colors[colorScheme ?? 'light'].tint}
            />
        </View>
        <View style={styles.settingItem}>
            <RNButton
                title="Tüm Kitaplık Verilerini Sil"
                onPress={handleClearAllData}
                color="red"
            />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageTitle: { marginBottom: 30, textAlign: 'center' },
  section: { marginBottom: 25, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  sectionTitle: { fontSize: 18, marginBottom: 15, fontWeight: '600' },
  settingItem: { marginBottom: 20 },
  statusLabel: { fontSize: 16, fontWeight: '500', marginBottom: 3 },
  statusText: { fontSize: 15, fontStyle: 'italic' },
});