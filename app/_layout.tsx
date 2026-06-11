import '../global.css';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/features/auth/authStore';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { colors } from '@/theme/colors';

// Корневой layout: провайдеры, тёмная тема по умолчанию,
// восстановление сессии и настроек при запуске.
export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    // Тёмная тема по умолчанию (light доступен через настройки профиля)
    setColorScheme('dark');
    hydrate();
    hydrateSettings();
  }, [hydrate, hydrateSettings, setColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.dark.bg },
              animation: 'slide_from_right',
            }}
          />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
