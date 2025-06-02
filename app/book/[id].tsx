// app/book/[id].tsx
import { StyleSheet, Button as RNButton } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function BookDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // Parametreyi almak için

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Kitap Detayı' }} />
      <ThemedText type="title">Kitap Detayı</ThemedText>
      <ThemedText>ID: {id}</ThemedText>
      {/* Kitap detayları buraya gelecek */}
      <RNButton title="Geri Dön" onPress={() => router.back()} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});