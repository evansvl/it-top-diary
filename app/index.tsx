import { View } from 'react-native';
import { Redirect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/authStore';

// Точка входа «/»: ждём гидрацию, затем разводим по сессии.
export default function Index() {
  const status = useAuthStore((s) => s.status);

  // Пока проверяем токен — показываем нейтральный фон (без спиннера)
  if (status === 'idle' || status === 'hydrating') {
    return (
      <Animated.View
        entering={FadeIn}
        className="flex-1 bg-ink-900"
      >
        <View className="flex-1" />
      </Animated.View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
