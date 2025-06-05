// C:/Users/yunus/KitapligimApp/app/settings.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Button as RNButton, Alert, Platform, AppState, ActivityIndicator, TouchableOpacity } from 'react-native'; // TouchableOpacity eklendi
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'; // DateTimePicker importu
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
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(20, 0, 0, 0))); // Başlangıçta 20:00
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  // Zaman seçici değiştiğinde tetiklenir
  const onChangeTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || reminderTime;
    setShowTimePicker(Platform.OS === 'ios'); // iOS'ta seçiciyi kapatmak için farklı bir mantık gerekebilir
    setReminderTime(currentDate);
    console.log('[SettingsScreen] Yeni hatırlatıcı saati seçildi:', currentDate.toLocaleTimeString());
    // Zaman değiştiğinde hatırlatıcıyı hemen yeniden planlayabiliriz veya bir "Kaydet" butonu ekleyebiliriz.
    // Şimdilik sadece state'i güncelleyelim.
  };

  // Bildirim izni isteme ve ardından hatırlatıcıyı planlama
  const requestPermissionsAndScheduleReminder = async (timeToSchedule: Date) => { // Parametre olarak timeToSchedule eklendi
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
      console.log(`[SettingsScreen] İzin verildi, günlük hatırlatıcı planlanıyor (${timeToSchedule.getHours()}:${String(timeToSchedule.getMinutes()).padStart(2, '0')})...`);
      await Notifications.cancelAllScheduledNotificationsAsync();

      try {
        const trigger: Notifications.NotificationTriggerInput = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: timeToSchedule.getHours(), // Seçilen saati kullan
          minute: timeToSchedule.getMinutes(), // Seçilen dakikayı kullan
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
        Alert.alert("Başarılı", `Günlük okuma hatırlatıcısı her gün ${String(timeToSchedule.getHours()).padStart(2, '0')}:${String(timeToSchedule.getMinutes()).padStart(2, '0')} için ayarlandı.`);
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

  // Kullanıcının hatırlatıcıyı ayarlamasını sağlayacak fonksiyon
  const handleSetReminder = async () => {
    if (notificationPermissionStatus === 'granted') {
      await requestPermissionsAndScheduleReminder(reminderTime);
      Alert.alert('Hatırlatıcı Ayarlandı', `Günlük hatırlatıcı saat ${reminderTime.getHours()}:${String(reminderTime.getMinutes()).padStart(2, '0')} olarak ayarlandı.`);
      setIsReminderScheduled(true); // Durumu güncelle
    } else {
      // Bu else bloğu artık handleRequestPermissionFlow tarafından yönetilecek
      // Alert.alert('İzin Gerekli', 'Hatırlatıcı ayarlamak için lütfen bildirim izinlerini etkinleştirin.');
      console.log('[SettingsScreen] Hatırlatıcı ayarlamak için izin gerekli, izin isteme akışı başlatılıyor.');
      await handleRequestPermissionFlow(); // Yeni fonksiyonu çağır
    }
  };

  // Yeni: İzin isteme ve ardından hatırlatıcı ayarlama akışını yöneten fonksiyon
  const handleRequestPermissionFlow = async () => {
    console.log('[SettingsScreen] Bildirim izni isteniyor (akış)...');
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    setNotificationPermissionStatus(status);
    if (status === 'granted') {
      console.log('[SettingsScreen] İzin verildi (akış), hatırlatıcı ayarlanıyor...');
      // handleSetReminder'ı doğrudan çağırmak yerine, içindeki mantığı burada tekrarlayabiliriz
      // veya handleSetReminder'ın sadece izinliyse çalışan kısmını çağırabiliriz.
      // Şimdilik, izin alındıktan sonra doğrudan planlama yapalım.
      await requestPermissionsAndScheduleReminder(reminderTime);
      Alert.alert('Hatırlatıcı Ayarlandı', `Günlük hatırlatıcı saat ${reminderTime.getHours()}:${String(reminderTime.getMinutes()).padStart(2, '0')} olarak ayarlandı.`);
      setIsReminderScheduled(true);
    } else {
      Alert.alert('İzin Reddedildi', 'Bildirim izinleri verilmediği için hatırlatıcı ayarlanamadı.');
    }
  };

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
              <ThemedText style={styles.settingText}>
                Günlük hatırlatıcı {`${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`} için ayarlı.
              </ThemedText>
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
                title={`Günlük Hatırlatıcı Ayarla (${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')})`}
                onPress={() => requestPermissionsAndScheduleReminder(reminderTime)} // Düzeltme: Fonksiyonu arrow function ile çağır
                color={Colors[colorScheme ?? 'light'].tint}
              />
            </View>
          )
        ) : (
          // İzin verilmemişse (undetermined veya denied):
          <View style={styles.settingItem}>
            <RNButton
              title="Bildirim İzni İste ve Hatırlatıcı Ayarla"
              onPress={() => requestPermissionsAndScheduleReminder(reminderTime)} // Düzeltme: Fonksiyonu arrow function ile çağır
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

      {/* Zaman Seçici ve Ayarlama Butonu */} 
      {notificationPermissionStatus === 'granted' && (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Hatırlatıcı Saati</ThemedText>
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timePickerButton}>
            <ThemedText style={styles.timePickerButtonText}>
              Saat Seç: {`${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`}
            </ThemedText>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={reminderTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onChangeTime}
            />
          )}
          <RNButton
            title="Seçili Saatte Hatırlatıcı Ayarla/Güncelle"
            onPress={handleSetReminder} // Bu fonksiyon zaten reminderTime'ı kullanıyor
            color={Colors[colorScheme ?? 'light'].tint}
            disabled={isReminderScheduled && 
                        new Date(new Date().setHours(reminderTime.getHours(), reminderTime.getMinutes(),0,0)).getTime() === 
                        new Date(new Date().setHours(20,0,0,0)).getTime() // Eğer mevcut hatırlatıcı 20:00 ise ve seçili saat de 20:00 ise butonu pasif yapabiliriz (opsiyonel)
                      }
          />
        </View>
      )}
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
  container: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Açık bir ayırıcı renk
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  settingItem: {
    marginBottom: 15,
    // flexDirection: 'row', // Buton ve metni yan yana getirmek için gerekebilir
    // alignItems: 'center', // Dikeyde ortalamak için
    // justifyContent: 'space-between', // Aralarına boşluk koymak için
  },
  settingText: {
    fontSize: 16,
    marginBottom: 5, // Butonla arasında biraz boşluk için
    // flex: 1, // Eğer flexDirection: 'row' kullanılırsa metnin kalan alanı kaplaması için
  },
  permissionText: {
    marginTop: 5,
    fontSize: 14,
    fontStyle: 'italic',
  },
  timePickerButton: { // YENİ EKLEDİ
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: Colors.light.tint, // Temadan renk alabiliriz
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  timePickerButtonText: { // YENİ EKLEDİ
    color: '#fff', // Buton içindeki yazı rengi
    fontSize: 16,
  },
  // Diğer veri yönetimi butonları için stiller (opsiyonel)
  dataManagementButton: {
    marginTop: 10, // Butonlar arası boşluk
  },
});
