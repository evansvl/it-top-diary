import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';

// Шапка экрана корневого стека: «назад» + заголовок (как в настройках).
export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center gap-2 px-2 py-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="p-2 active:opacity-60"
      >
        <Ionicons name="chevron-back" size={24} color={colors.dark.text} />
      </Pressable>
      <Text className="text-xl font-bold text-slate-50">{title}</Text>
    </View>
  );
}
