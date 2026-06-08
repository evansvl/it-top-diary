import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSchedule } from '@/features/schedule/useSchedule';
import type { ScheduleLesson } from '@/features/schedule/types';
import {
  dayTitle,
  isTodayIso,
  monthAnchorFromIso,
  shiftDay,
  todayIso,
} from '@/lib/date';

function LessonRow({ l }: { l: ScheduleLesson }) {
  return (
    <View className="mb-3 flex-row rounded-card bg-ink-800 p-4">
      <View className="w-16">
        <Text className="text-base font-bold text-primary-light">
          {l.startedAt}
        </Text>
        <Text className="text-xs text-slate-500">{l.finishedAt}</Text>
      </View>
      <View className="flex-1 border-l border-ink-600 pl-3">
        <Text className="text-sm font-semibold text-slate-50" numberOfLines={2}>
          {l.subject}
        </Text>
        <Text className="mt-1 text-xs text-slate-400" numberOfLines={1}>
          {l.teacher}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500">Кабинет: {l.room}</Text>
      </View>
    </View>
  );
}

// Расписание по дням: ‹ день › с переходом, тап по дате — сегодня.
export default function ScheduleTab() {
  const [day, setDay] = useState<string>(todayIso());
  const { data, isLoading, isError, refetch } = useSchedule(
    monthAnchorFromIso(day),
  );
  const lessons = data?.find((d) => d.date === day)?.lessons ?? [];
  const today = isTodayIso(day);

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-slate-50">Расписание</Text>
      </View>

      {/* Переключатель дней */}
      <View className="mb-1 flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => setDay((d) => shiftDay(d, -1))}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-800 active:opacity-70"
        >
          <Text className="text-xl leading-6 text-slate-200">‹</Text>
        </Pressable>
        <Pressable onPress={() => setDay(todayIso())} hitSlop={8}>
          <Text className="text-base font-semibold text-slate-100">
            {dayTitle(day)}
            {today ? ' · сегодня' : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setDay((d) => shiftDay(d, 1))}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-800 active:opacity-70"
        >
          <Text className="text-xl leading-6 text-slate-200">›</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1E6FD9" />
      ) : isError || !data ? (
        <View className="mt-8 items-center px-4">
          <Text className="text-sm text-danger">Не удалось загрузить</Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-3 rounded-full bg-ink-800 px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm text-slate-200">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(l) => String(l.lesson)}
          renderItem={({ item }) => <LessonRow l={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-slate-400">
              В этот день занятий нет
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
