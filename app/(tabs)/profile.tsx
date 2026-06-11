import { Alert, ScrollView, Text, View } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-title">Профиль</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <ProfileCard />

        <View className="mt-6 overflow-hidden rounded-card bg-surface">
          <SettingsRow
            label="Настройки"
            hint="Автовход, обновления, кэш"
            onPress={() => router.push('/settings')}
          />
        </View>

        <View className="mt-6">
          <Button title="Выйти" variant="ghost" onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
