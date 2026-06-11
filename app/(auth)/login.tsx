import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { AuthLogo } from '@/components/auth/AuthLogo';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore } from '@/features/auth/authStore';

// Экран входа. Контейнер: безопасные зоны, уход от клавиатуры, скролл.
export default function LoginScreen() {
  // После успешного входа стор переключает статус — уводим на /home.
  const status = useAuthStore((s) => s.status);
  if (status === 'authenticated') return <Redirect href="/home" />;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 py-10">
            <AuthLogo />
            <LoginForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
