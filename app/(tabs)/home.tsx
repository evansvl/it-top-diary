import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/authStore';
import { HomeworkCard } from '@/components/home/HomeworkCard';
import { GradesCard } from '@/components/home/GradesCard';
import { ScheduleCard } from '@/components/home/ScheduleCard';

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

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-slate-400">Привет,</Text>
        <Text className="mt-1 text-2xl font-bold text-slate-50">
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
      </ScrollView>
    </SafeAreaView>
  );
}
