// C:/Users/yunus/KitapligimApp/app/settings.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Button as RNButton, Alert, Platform, AppState, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { clearAllBooks, getAllBooks } from '@/services/bookStorage';

// Bildirim işleyicisi
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const behavior: Notifications.NotificationBehavior = {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      shouldShowBanner: true, // TypeScript'in beklediği
      shouldShowList: true,   // TypeScript'in beklediği
    };
    return behavior;
  },
});

const DAILY_REMINDER_NOTIFICATION_ID = "daily-reading-reminder-v4"; // Identifier'ı tekrar güncelleyelim, emin olmak için

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<Notifications.PermissionStatus | undefined>();
  const [isReminderScheduled, setIsReminderScheduled] = useState(false); // Hatırlatıcı planlı mı?
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // İzinleri ve planlanmış bildirimi kontrol et
  const checkStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    console.log('[SettingsScreen] İzinler ve planlanmış bildirim durumu kontrol ediliyor...');
    try {
      const permissions = await Notifications.getPermissionsAsync();
      setNotificationPermissionStatus(permissions.status);
      console.log('[SettingsScreen] Mevcut bildirim izni:', permissions.status);

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const reminderExists = scheduledNotifications.some(
        (notif) => notif.identifier === DAILY_REMINDER_NOTIFICATION_ID
      );
      setIsReminderScheduled(reminderExists);
      console.log('[SettingsScreen] Günlük hatırlatıcı planlı mı:', reminderExists);
    } catch (error) {
      console.error("[SettingsScreen] Durum kontrol edilirken hata:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[SettingsScreen] Uygulama aktif oldu, durum tekrar kontrol ediliyor.');
        checkStatus();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [checkStatus]);

  // Bildirim izni isteme ve ardından hatırlatıcıyı planlama
  const requestPermissionsAndScheduleReminder = async () => {
    let currentStatus = notificationPermissionStatus;
    if (currentStatus !== 'granted') {
      console.log('[SettingsScreen] Bildirim izni isteniyor...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      setNotificationPermissionStatus(status); // State'i hemen güncelle
      currentStatus = status;
    }

    if (currentStatus === 'granted') {
      console.log('[SettingsScreen] İzin verildi, günlük hatırlatıcı planlanıyor (20:00)...');
      await Notifications.cancelAllScheduledNotificationsAsync(); // Önce tümünü iptal edelim (veya sadece ID ile)
      // await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_NOTIFICATION_ID); // Sadece bu ID'liyi iptal et

      try {
      
        const trigger: Notifications.NotificationTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR, // Use the enum member directly
          hour: 20,
          minute: 0,
          repeats: true,
        };
   
        console.log('[SettingsScreen] Bildirim planlanıyor, trigger:', JSON.stringify(trigger, null, 2));

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📚 Kitap Okuma Vakti!",
            body: "Bugün kitabına biraz zaman ayırdın mı? Keyifli okumalar dileriz!",
            sound: 'default',
            data: { type: "daily-reminder" }
          },
          trigger,
          identifier: DAILY_REMINDER_NOTIFICATION_ID,
        });
        Alert.alert("Başarılı", "Günlük okuma hatırlatıcısı her gün 20:00 için ayarlandı.");
        setIsReminderScheduled(true); // State'i güncelle
        console.log('[SettingsScreen] Hatırlatıcı başarıyla planlandı.');
      } catch (error: any) {
        console.error("[SettingsScreen] Bildirim planlanırken hata:", error, error.message, error.code);
        Alert.alert("Hata", `Hatırlatıcı ayarlanamadı. Detay: ${error.message} (Kod: ${error.code})`);
        setIsReminderScheduled(false); // Hata durumunda false yap
      }
    } else {
      console.log('[SettingsScreen] İzin verilmedi, hatırlatıcı planlanamadı.');
      Alert.alert('İzin Gerekli', 'Hatırlatıcıları ayarlamak için bildirim izni vermelisiniz. Ayarlardan izinleri değiştirebilirsiniz.');
    }
  };

  // Planlanmış hatırlatıcıyı iptal etme
  const cancelDailyReminder = async () => {
    console.log('[SettingsScreen] Günlük hatırlatıcı iptal ediliyor...');
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_NOTIFICATION_ID);
    Alert.alert("Başarılı", "Günlük okuma hatırlatıcısı iptal edildi.");
    setIsReminderScheduled(false); // State'i güncelle
    console.log('[SettingsScreen] Hatırlatıcı iptal edildi.');
  };

  // Diğer ayar fonksiyonları (handleClearAllData, handleShowBookCount) önceki gibi kalabilir
  const handleClearAllData = async () => { /* ... */ };
  const handleShowBookCount = async () => { /* ... */ };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Ayarlar' }} />
      <ThemedText type="title" style={styles.pageTitle}>Ayarlar</ThemedText>

      <View style={styles.section}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Günlük Okuma Hatırlatıcısı</ThemedText>
        {isLoadingStatus ? (
          <ActivityIndicator style={{ marginVertical: 10 }} color={Colors[colorScheme ?? 'light'].tint} />
        ) : notificationPermissionStatus === 'granted' ? (
          // İzin verilmişse:
          isReminderScheduled ? (
            // Hatırlatıcı zaten planlıysa:
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingText}>Günlük hatırlatıcı 20:00 için ayarlı.</ThemedText>
              <RNButton
                title="Hatırlatıcıyı İptal Et"
                onPress={cancelDailyReminder}
                color={Colors[colorScheme ?? 'light'].icon} // Daha sönük bir renk
              />
            </View>
          ) : (
            // Hatırlatıcı planlı değilse:
            <View style={styles.settingItem}>
              <RNButton
                title="Günlük Hatırlatıcı Ayarla (20:00)"
                onPress={requestPermissionsAndScheduleReminder} // Bu fonksiyon hem izin ister (gerekirse) hem de planlar
                color={Colors[colorScheme ?? 'light'].tint}
              />
            </View>
          )
        ) : (
          // İzin verilmemişse (undetermined veya denied):
          <View style={styles.settingItem}>
            <RNButton
              title="Bildirim İzni İste ve Hatırlatıcı Ayarla"
              onPress={requestPermissionsAndScheduleReminder}
              color={Colors[colorScheme ?? 'light'].tint}
            />
            <ThemedText style={styles.permissionText}>
              {notificationPermissionStatus === 'denied'
                ? "Bildirimler daha önce reddedilmiş. Hatırlatıcı için önce izin vermelisiniz."
                : "Hatırlatıcıları kullanmak için bildirim izni gereklidir."}
            </ThemedText>
          </View>
        )}
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
  pageTitle: { marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 25, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  sectionTitle: { fontSize: 18, marginBottom: 15, fontWeight: '600' },
  settingItem: { marginBottom: 15, },
  settingText: { fontSize: 16, marginBottom: 10, lineHeight: 22 },
  permissionText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
});