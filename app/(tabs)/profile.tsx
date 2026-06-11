import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/authStore';

export default function ProfileTab() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    Alert.alert('Выйти из аккаунта?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-slate-50">Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <ProfileCard />

        <View className="mt-6 overflow-hidden rounded-card bg-ink-800">
          <SettingsRow
            label="Настройки"
            hint="Автовход, обновления, кэш"
            onPress={() => router.push('/settings')}
          />
        </View>

        <View className="mt-6">
          <Button title="Выйти" variant="ghost" onPress={onLogout} />
        </View>

        {/* Рекламный баннер (партнёрская ссылка aéza) */}
        <Pressable
          className="mt-6 active:opacity-80"
          onPress={() =>
            void Linking.openURL('https://aeza.net/?ref=613643')
          }
        >
          <Image
            source={{ uri: 'https://io.aeza.net/partner-banners/5181las.png' }}
            style={{ width: '100%', aspectRatio: 728 / 90 }}
            resizeMode="contain"
            accessibilityLabel="aéza ref link"
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
