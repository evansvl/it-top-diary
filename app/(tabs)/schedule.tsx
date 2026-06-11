import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MarkChip } from '@/components/grades/MarkChip';
import {
  marksForDate,
  normalizeSubject,
  visitsForDate,
} from '@/features/grades/gradesApi';
import { useGrades } from '@/features/grades/useGrades';
import {
  VISIT_STATUS_META,
  type DaySubjectMarks,
  type Mark,
  type VisitStatus,
} from '@/features/grades/types';
import { useSchedule } from '@/features/schedule/useSchedule';
import type { ScheduleLesson } from '@/features/schedule/types';
import {
  dayTitle,
  isTodayIso,
  monthAnchorFromIso,
  shiftDay,
  todayIso,
} from '@/lib/date';

function LessonRow({
  l,
  marks,
  visit,
}: {
  l: ScheduleLesson;
  marks?: Mark[];
  visit?: VisitStatus;
}) {
  const visitMeta = visit != null ? VISIT_STATUS_META[visit] : undefined;
  return (
    <View className="mb-3 flex-row rounded-card bg-ink-800 p-4">
      <View className="w-16">
        <Text className="text-base font-bold text-primary-light">
          {l.startedAt}
        </Text>
        <Text className="text-xs text-slate-500">{l.finishedAt}</Text>
      </View>
      <View className="flex-1 border-l border-ink-600 pl-3">
        <View className="flex-row items-start">
          <Text
            className="flex-1 pr-2 text-sm font-semibold text-slate-50"
            numberOfLines={2}
          >
            {l.subject}
          </Text>
          {visitMeta ? (
            <View className={`rounded-full px-2 py-0.5 ${visitMeta.bg}`}>
              <Text className={`text-xs font-semibold ${visitMeta.text}`}>
                {visitMeta.label}
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-1 text-xs text-slate-400" numberOfLines={1}>
          {l.teacher}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500">Кабинет: {l.room}</Text>
        {marks && marks.length > 0 ? (
          <View className="mt-2 -mb-2 flex-row flex-wrap">
            {marks.map((m, i) => (
              <MarkChip key={`${m.kind}-${i}`} value={m.value} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// Оценки дня по предметам, которых нет в расписании этого дня
// (или название в журнале не совпало с расписанием).
function DayMarksCard({ groups }: { groups: DaySubjectMarks[] }) {
  return (
    <View className="mb-3 rounded-card bg-ink-800 p-4">
      <Text className="text-sm font-semibold text-slate-50">
        Оценки за день
      </Text>
      {groups.map((g) => (
        <View key={g.subject} className="mt-2">
          <Text className="text-xs text-slate-400" numberOfLines={1}>
            {g.subject}
          </Text>
          <View className="mt-1 -mb-2 flex-row flex-wrap">
            {g.marks.map((m, i) => (
              <MarkChip key={`${m.kind}-${i}`} value={m.value} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// Расписание по дням: ‹ день › с переходом, тап по дате — сегодня.
export default function ScheduleTab() {
  const [day, setDay] = useState<string>(todayIso());
  const { data, isLoading, isError, refetch } = useSchedule(
    monthAnchorFromIso(day),
  );
  const lessons = useMemo(
    () => data?.find((d) => d.date === day)?.lessons ?? [],
    [data, day],
  );
  const today = isTodayIso(day);

  // Оценки, полученные в выбранный день: вешаем на первую пару предмета,
  // не совпавшие по названию — отдельной карточкой сверху.
  // Посещаемость из журнала: статусы предмета раздаём парам по порядку
  // (N-я пара предмета за день → N-я запись журнала).
  const { data: grades } = useGrades();
  const { lessonMarks, lessonVisits, unmatched } = useMemo(() => {
    const dayMarks = grades ? marksForDate(grades, day) : [];
    const bySubject = new Map(
      dayMarks.map((g) => [normalizeSubject(g.subject), g]),
    );
    const dayVisits = grades
      ? visitsForDate(grades, day)
      : new Map<string, VisitStatus[]>();
    const lessonMarks = new Map<number, Mark[]>();
    const lessonVisits = new Map<number, VisitStatus>();
    const visitsTaken = new Map<string, number>();
    for (const l of lessons) {
      const key = normalizeSubject(l.subject);
      const group = bySubject.get(key);
      if (group) {
        lessonMarks.set(l.lesson, group.marks);
        bySubject.delete(key);
      }
      const statuses = dayVisits.get(key);
      if (statuses && statuses.length > 0) {
        const idx = visitsTaken.get(key) ?? 0;
        const status = statuses[idx] ?? statuses[statuses.length - 1];
        if (status != null) lessonVisits.set(l.lesson, status);
        visitsTaken.set(key, idx + 1);
      }
    }
    return { lessonMarks, lessonVisits, unmatched: [...bySubject.values()] };
  }, [grades, day, lessons]);

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
          renderItem={({ item }) => (
            <LessonRow
              l={item}
              marks={lessonMarks.get(item.lesson)}
              visit={lessonVisits.get(item.lesson)}
            />
          )}
          ListHeaderComponent={
            unmatched.length > 0 ? <DayMarksCard groups={unmatched} /> : null
          }
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
