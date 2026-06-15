import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/authStore';
import { useAutoUpdateCheck } from '@/features/updates/useAutoUpdateCheck';
import { useNotifications } from '@/features/notifications/useNotifications';
import { colors } from '@/theme/colors';
import { useTheme } from '@/theme/useColorScheme';

// Главная вкладка по умолчанию.
export const unstable_settings = { initialRouteName: 'home' };

// Нижняя навигация авторизованной зоны. Гард: без сессии — на логин
// (срабатывает и после выхода из профиля).
export default function TabsLayout() {
  const status = useAuthStore((s) => s.status);
  const { palette } = useTheme();
  // Тихая проверка обновлений после входа (один раз за запуск)
  useAutoUpdateCheck();
  // Уведомления: интро/разрешение + синхронизация при входе и из фона
  useNotifications();
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Расписание',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Оценки',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ribbon-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: 'ДЗ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
