import '../global.css';
// Регистрируем фоновую задачу и обработчик уведомлений на самом старте JS
// (в т.ч. при headless-запуске ОС), иначе фоновые уведомления не сработают.
import '@/features/notifications/background';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import {
  queryClient,
  queryPersistOptions,
} from '@/lib/queryClient';
import { useQueryLifecycle } from '@/lib/useQueryLifecycle';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useAuthStore } from '@/features/auth/authStore';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { useTheme } from '@/theme/useColorScheme';

// Держим сплэш, пока не восстановим настройки и не применим тему — иначе
// светлая тема моргала: приложение стартовало в тёмной и перекрашивалось
// после асинхронной гидрации. Ошибки игнорируем (сплэш мог уже скрыться).
void SplashScreen.preventAutoHideAsync();

// Применяет сохранённую тему и рисует навигатор. До гидрации настроек экран
// скрыт сплэшем, поэтому красим сразу в сохранённый режим без промежуточного
// тёмного кадра, а сплэш убираем уже после применения темы.
function ThemedNavigator() {
  const { setColorScheme } = useColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const isRestoringCache = useIsRestoring();
  const { palette, isDark } = useTheme();

  useEffect(() => {
    if (!settingsHydrated || isRestoringCache) return;
    setColorScheme(theme);
    void SplashScreen.hideAsync();
  }, [isRestoringCache, settingsHydrated, theme, setColorScheme]);

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
      <OfflineBanner />
    </>
  );
}

// Корневой layout: провайдеры, восстановление сессии и настроек при запуске.
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  useQueryLifecycle();

  useEffect(() => {
    hydrate();
    hydrateSettings();
  }, [hydrate, hydrateSettings]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={queryPersistOptions}
      >
        <SafeAreaProvider>
          <ThemedNavigator />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
