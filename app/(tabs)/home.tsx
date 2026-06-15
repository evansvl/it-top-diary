import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/authStore';
import { HomeworkCard } from '@/components/home/HomeworkCard';
import { GradesCard } from '@/components/home/GradesCard';
import { ScheduleCard } from '@/components/home/ScheduleCard';
import { ThemedRefreshControl } from '@/components/ui/ThemedRefreshControl';
import { queryClient } from '@/lib/queryClient';
import { colors } from '@/theme/colors';

// Плитки дополнительных разделов (экраны корневого стека).
const SECTION_TILES: {
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  { href: '/news', icon: 'newspaper-outline', label: 'Новости' },
  { href: '/exams', icon: 'school-outline', label: 'Экзамены' },
  { href: '/leaderboard', icon: 'trophy-outline', label: 'Рейтинг' },
  { href: '/reviews', icon: 'chatbubbles-outline', label: 'Отзывы' },
  { href: '/payments', icon: 'card-outline', label: 'Оплата' },
];

// Имя из ФИО (Фамилия Имя Отчество → Имя).
function firstName(full?: string): string {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  return parts[1] ?? parts[0] ?? '';
}

// Дашборд: приветствие + сводные карточки (тап → переход на вкладку).
export default function HomeTab() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const name = firstName(user?.fullName);

  // Pull-to-refresh: обновляем все активные запросы карточек дашборда.
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text className="text-sm text-muted">Привет,</Text>
        <Text className="mt-1 text-2xl font-bold text-title">
          {name || 'студент'} 👋
        </Text>

        <Pressable
          onPress={() => router.push('/homework')}
          className="active:opacity-80"
        >
          <HomeworkCard />
        </Pressable>

        <Pressable
          onPress={() => router.push('/grades')}
          className="active:opacity-80"
        >
          <GradesCard />
        </Pressable>

        <Pressable
          onPress={() => router.push('/schedule')}
          className="active:opacity-80"
        >
          <ScheduleCard />
        </Pressable>

        {/* Дополнительные разделы */}
        <View className="mt-4 flex-row flex-wrap gap-3">
          {SECTION_TILES.map((t) => (
            <Pressable
              key={t.label}
              onPress={() => router.push(t.href)}
              className="w-[30%] grow items-center rounded-card bg-surface py-4 active:opacity-70"
            >
              <Ionicons name={t.icon} size={22} color={colors.primaryLight} />
              <Text className="mt-2 text-xs font-medium text-body">
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
