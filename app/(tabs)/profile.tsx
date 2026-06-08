import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/authStore';
import { clearCredentials } from '@/lib/secureStore';

// Строка настроек: значение справа или действие (с шевроном).
function SettingsRow({
  label,
  value,
  onPress,
  danger,
  border,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  border?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between px-4 py-3.5 active:opacity-70 ${
        border ? 'border-b border-ink-700' : ''
      }`}
    >
      <Text
        className={`text-sm ${danger ? 'text-danger' : 'text-slate-100'}`}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-sm text-slate-400">{value}</Text>
      ) : onPress ? (
        <Text className="text-lg text-slate-500">›</Text>
      ) : null}
    </Pressable>
  );
}

export default function ProfileTab() {
  const logout = useAuthStore((s) => s.logout);

  const onForgetPassword = () => {
    Alert.alert(
      'Забыть сохранённый пароль?',
      'Логин и пароль будут удалены с устройства.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Забыть',
          style: 'destructive',
          onPress: () => {
            void clearCredentials();
            Alert.alert('Готово', 'Сохранённые данные удалены.');
          },
        },
      ],
    );
  };

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

        <Text className="mb-2 mt-6 px-1 text-xs uppercase text-slate-500">
          Настройки
        </Text>
        <View className="overflow-hidden rounded-card bg-ink-800">
          <SettingsRow label="Версия приложения" value="1.0.0" border />
          <SettingsRow
            label="Забыть сохранённый пароль"
            onPress={onForgetPassword}
          />
        </View>

        <View className="mt-6">
          <Button title="Выйти" variant="ghost" onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
