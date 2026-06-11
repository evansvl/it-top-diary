import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MarkChip } from '@/components/grades/MarkChip';
import {
  MarkDetailModal,
  type MarkDetail,
} from '@/components/grades/MarkDetailModal';
import { HomeworkDetailModal } from '@/components/homework/HomeworkDetailModal';
import type { HomeworkItem } from '@/features/homework/types';
import { useGrades } from '@/features/grades/useGrades';
import {
  attendanceForRange,
  type AttendanceSlice,
} from '@/features/grades/gradesApi';
import { type Mark, type SubjectGrades } from '@/features/grades/types';
import { monthAnchorIso, todayIso, weekStartIso } from '@/lib/date';

// Карточка предмета: все оценки (без ограничения количества), тап по
// оценке — детали (за что получена).
function SubjectCard({
  item,
  onPressMark,
}: {
  item: SubjectGrades;
  onPressMark: (mark: Mark) => void;
}) {
  return (
    <View className="mb-3 rounded-card bg-surface p-4">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-sm font-semibold text-title">
          {item.subject}
        </Text>
        <Text className="text-base font-bold text-primary-light">
          {item.average != null ? item.average.toFixed(2) : '—'}
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap">
        {item.marks.map((m, i) => (
          <MarkChip
            key={`${m.kind}-${m.date}-${i}`}
            value={m.value}
            onPress={() => onPressMark(m)}
          />
        ))}
      </View>
    </View>
  );
}

function Summary({
  average,
  attendance,
  attendancePresent,
  attendanceTotal,
  totalMarks,
}: {
  average: number | null;
  attendance: number | null;
  attendancePresent: number;
  attendanceTotal: number;
  totalMarks: number;
}) {
  return (
    <View className="mb-4 flex-row rounded-card bg-surface p-5">
      <View className="flex-1 items-center">
        <Text className="text-3xl font-extrabold text-primary-light">
          {average != null ? average.toFixed(2) : '—'}
        </Text>
        <Text className="mt-1 text-xs text-muted">Средний балл</Text>
      </View>
      <View className="flex-1 items-center">
        <Text className="text-3xl font-extrabold text-success">
          {attendance != null ? `${Math.round(attendance * 100)}%` : '—'}
        </Text>
        <Text className="mt-1 text-xs text-muted">Посещаемость</Text>
        {attendanceTotal > 0 ? (
          <Text className="mt-0.5 text-xs text-faint">
            {attendancePresent} из {attendanceTotal} пар
          </Text>
        ) : null}
      </View>
      <View className="flex-1 items-center">
        <Text className="text-3xl font-extrabold text-title">
          {totalMarks}
        </Text>
        <Text className="mt-1 text-xs text-muted">Оценок</Text>
      </View>
    </View>
  );
}

// Посещаемость за период: процент + счётчик пар.
function AttendanceCol({
  title,
  slice,
}: {
  title: string;
  slice: AttendanceSlice;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-extrabold text-success">
        {slice.rate != null ? `${Math.round(slice.rate * 100)}%` : '—'}
      </Text>
      <Text className="mt-1 text-xs text-muted">{title}</Text>
      {slice.total > 0 ? (
        <Text className="mt-0.5 text-xs text-faint">
          {slice.present} из {slice.total} пар
        </Text>
      ) : null}
    </View>
  );
}

function AttendanceCard({
  week,
  month,
}: {
  week: AttendanceSlice;
  month: AttendanceSlice;
}) {
  return (
    <View className="mb-4 rounded-card bg-surface p-4">
      <Text className="mb-3 text-sm font-semibold text-title">
        Посещаемость
      </Text>
      <View className="flex-row">
        <AttendanceCol title="За неделю" slice={week} />
        <AttendanceCol title="За месяц" slice={month} />
      </View>
    </View>
  );
}

export default function GradesTab() {
  const { data, isLoading, isError, refetch } = useGrades();
  const [selectedMark, setSelectedMark] = useState<MarkDetail | null>(null);
  const [selectedHomework, setSelectedHomework] =
    useState<HomeworkItem | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-title">Оценки</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1E6FD9" />
      ) : isError || !data ? (
        <View className="mt-8 items-center px-4">
          <Text className="text-sm text-danger">Не удалось загрузить</Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-3 rounded-full bg-surface px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm text-body">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data.subjects}
          keyExtractor={(s) => String(s.subjectId)}
          renderItem={({ item }) => (
            <SubjectCard
              item={item}
              onPressMark={(mark) =>
                setSelectedMark({ subject: item.subject, mark })
              }
            />
          )}
          ListHeaderComponent={
            <>
              <Summary
                average={data.overallAverage}
                attendance={data.attendanceRate}
                attendancePresent={data.attendancePresent}
                attendanceTotal={data.attendanceTotal}
                totalMarks={data.totalMarks}
              />
              <AttendanceCard
                week={attendanceForRange(data, weekStartIso(todayIso()), todayIso())}
                month={attendanceForRange(data, monthAnchorIso(), todayIso())}
              />
            </>
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-muted">
              Оценок пока нет
            </Text>
          }
        />
      )}

      <MarkDetailModal
        detail={selectedMark}
        onClose={() => setSelectedMark(null)}
        onOpenHomework={(hw) => {
          // Закрываем детали оценки и открываем ДЗ — без вложенных модалок.
          setSelectedMark(null);
          setSelectedHomework(hw);
        }}
      />
      <HomeworkDetailModal
        item={selectedHomework}
        onClose={() => setSelectedHomework(null)}
      />
    </SafeAreaView>
  );
}
