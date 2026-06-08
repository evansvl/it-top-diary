import { ActivityIndicator, Text, View } from 'react-native';
import { useSchedule } from '@/features/schedule/useSchedule';
import { monthAnchorIso, todayIso } from '@/lib/date';

// Сводка расписания: пары на сегодня. Открывает экран /schedule.
export function ScheduleCard() {
  const { data, isLoading, isError } = useSchedule(monthAnchorIso());
  const today = data?.find((d) => d.date === todayIso());
  const lessons = today?.lessons ?? [];

  return (
    <View className="mt-4 rounded-card bg-ink-800 p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-50">Расписание</Text>
        <Text className="ml-2 text-lg text-slate-500">›</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="my-5" color="#1E6FD9" />
      ) : isError || !data ? (
        <Text className="mt-3 text-sm text-danger">Не удалось загрузить</Text>
      ) : (
        <View className="mt-3">
          <Text className="text-xs text-slate-400">Сегодня</Text>
          {lessons.length === 0 ? (
            <Text className="mt-1 text-sm text-slate-300">Занятий нет</Text>
          ) : (
            lessons.map((l) => (
              <View key={l.lesson} className="mt-2 flex-row">
                <Text className="w-14 text-sm text-slate-400">
                  {l.startedAt}
                </Text>
                <Text
                  className="flex-1 text-sm text-slate-100"
                  numberOfLines={1}
                >
                  {l.subject}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}
