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
import { useTheme } from '@/theme/useColorScheme';

// Применяет сохранённую тему и рисует навигатор. Тёмная — по умолчанию:
// выставляем её сразу, а пользовательский выбор — после гидрации настроек
// (чтобы не моргнуть системной светлой темой на старте).
function ThemedNavigator() {
  const { setColorScheme } = useColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const { palette, isDark } = useTheme();

  useEffect(() => {
    setColorScheme('dark');
  }, [setColorScheme]);

  useEffect(() => {
    if (settingsHydrated) setColorScheme(theme);
  }, [settingsHydrated, theme, setColorScheme]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

// Корневой layout: провайдеры, восстановление сессии и настроек при запуске.
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateSettings();
  }, [hydrate, hydrateSettings]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemedNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
