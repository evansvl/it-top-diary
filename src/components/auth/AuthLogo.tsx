import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Лого + название колледжа на экране входа. Анимация появления (Reanimated).
export function AuthLogo() {
  return (
    <Animated.View
      entering={FadeInDown.duration(500)}
      className="mb-10 items-center"
    >
      {/* Знак бренда: скруглённый квадрат с инициалами «IT» */}
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-card bg-primary">
        <Text className="text-3xl font-extrabold tracking-tight text-white">IT</Text>
      </View>
      <Text className="text-3xl font-extrabold text-ink-900 dark:text-slate-50">
        IT Top
      </Text>
      <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">
        Электронный дневник
      </Text>
    </Animated.View>
  );
}
