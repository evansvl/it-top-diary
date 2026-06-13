import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { UpdateCard } from '@/components/settings/UpdateCard';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { CURRENT_VERSION, useUpdatesStore } from '@/features/updates/updatesStore';
import { queryClient } from '@/lib/queryClient';
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
  type SavedCredentials,
} from '@/lib/secureStore';
import { useTheme } from '@/theme/useColorScheme';

const GITHUB_URL = 'https://github.com/evansvl/it-top-diary';
const AEZA_URL = 'https://aeza.net';
const VPN_URL = 'https://t.me/nnstorevpnbot';

// Заголовок секции настроек.
function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-6 px-1 text-xs uppercase text-faint">
      {title}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { palette, isDark } = useTheme();
  const autoCheckUpdates = useSettingsStore((s) => s.autoCheckUpdates);
  const theme = useSettingsStore((s) => s.theme);
  const setSetting = useSettingsStore((s) => s.setSetting);

  // Сохранённые учётные данные — для переключателя автовхода.
  const [creds, setCreds] = useState<SavedCredentials | null>(null);
  useEffect(() => {
    void loadCredentials().then(setCreds);
  }, []);

  // При открытии экрана сразу проверяем обновления (Android и iOS).
  useEffect(() => {
    if (useUpdatesStore.getState().status === 'idle') {
      void useUpdatesStore.getState().check();
    }
  }, []);

  const onToggleAutoLogin = (value: boolean) => {
    if (!creds) return;
    const next = { ...creds, autoLogin: value };
    setCreds(next);
    void saveCredentials(next);
  };

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
            setCreds(null);
            Alert.alert('Готово', 'Сохранённые данные удалены.');
          },
        },
      ],
    );
  };

  const onClearCache = () => {
    queryClient.clear();
    Alert.alert('Готово', 'Кэш очищен — данные будут загружены заново.');
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="flex-row items-center gap-2 px-2 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2 active:opacity-60"
        >
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </Pressable>
        <Text className="text-xl font-bold text-title">Настройки</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionTitle title="Аккаунт" />
        <View className="overflow-hidden rounded-card bg-surface">
          <SettingsRow
            label="Автовход"
            hint={
              creds
                ? 'Входить автоматически при запуске'
                : 'Нет сохранённых данных — войдите с «Запомнить меня»'
            }
            switchValue={creds?.autoLogin ?? false}
            onSwitch={onToggleAutoLogin}
            switchDisabled={!creds}
            border
          />
          <SettingsRow
            label="Забыть сохранённый пароль"
            danger
            onPress={creds ? onForgetPassword : undefined}
          />
        </View>

        <SectionTitle title="Оформление" />
        <View className="overflow-hidden rounded-card bg-surface">
          <SettingsRow
            label="Тёмная тема"
            hint={isDark ? 'Тёмное оформление' : 'Светлое оформление'}
            switchValue={theme === 'dark'}
            onSwitch={(v) => setSetting('theme', v ? 'dark' : 'light')}
          />
        </View>

        <SectionTitle title="Обновления" />
        <View className="overflow-hidden rounded-card bg-surface">
          <SettingsRow
            label="Проверять при запуске"
            hint="Сообщать о новых версиях на GitHub"
            switchValue={autoCheckUpdates}
            onSwitch={(v) => setSetting('autoCheckUpdates', v)}
          />
        </View>
        <View className="mt-3">
          <UpdateCard />
        </View>

        <SectionTitle title="О приложении" />
        <View className="overflow-hidden rounded-card bg-surface">
          <SettingsRow label="Версия" value={CURRENT_VERSION} border />
          <SettingsRow
            label="GitHub"
            hint="Исходный код и релизы"
            onPress={() => void Linking.openURL(GITHUB_URL)}
            border
          />
          <SettingsRow
            label="Очистить кэш данных"
            hint="Оценки, расписание и ДЗ загрузятся заново"
            onPress={onClearCache}
          />
        </View>

        <SectionTitle title="Партнёры" />
        <View className="overflow-hidden rounded-card bg-surface">
          <SettingsRow
            label="Нужен сервер для проекта?"
            hint="Aeza — быстрый VPS-хостинг для твоих идей"
            onPress={() => void Linking.openURL(AEZA_URL)}
            border
          />
          <SettingsRow
            label="YouTube и Telegram не работают?"
            hint="NN Store VPN — быстрый VPN, открой в Telegram"
            onPress={() => void Linking.openURL(VPN_URL)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
