import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGrades } from '@/features/grades/useGrades';
import {
  markBg,
  markColor,
  markLabel,
  type SubjectGrades,
} from '@/features/grades/types';

function MarkChip({ value }: { value: number }) {
  return (
    <View
      className={`mb-2 mr-2 h-8 min-w-[32px] items-center justify-center rounded-lg px-2 ${markBg(
        value,
      )}`}
    >
      <Text className={`text-sm font-bold ${markColor(value)}`}>
        {markLabel(value)}
      </Text>
    </View>
  );
}

// Карточка предмета: все оценки (без ограничения количества).
function SubjectCard({ item }: { item: SubjectGrades }) {
  return (
    <View className="mb-3 rounded-card bg-ink-800 p-4">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-sm font-semibold text-slate-50">
          {item.subject}
        </Text>
        <Text className="text-base font-bold text-primary-light">
          {item.average != null ? item.average.toFixed(2) : '—'}
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap">
        {item.marks.map((m, i) => (
          <MarkChip key={`${m.kind}-${m.date}-${i}`} value={m.value} />
        ))}
      </View>
    </View>
  );
}

function Summary({
  average,
  attendance,
  totalMarks,
}: {
  average: number | null;
  attendance: number | null;
  totalMarks: number;
}) {
  return (
    <View className="mb-4 flex-row rounded-card bg-ink-800 p-5">
      <View className="flex-1 items-center">
        <Text className="text-3xl font-extrabold text-primary-light">
          {average != null ? average.toFixed(2) : '—'}
        </Text>
        <Text className="mt-1 text-xs text-slate-400">Средний балл</Text>
      </View>
      <View className="flex-1 items-center">
        <Text className="text-3xl font-extrabold text-success">
          {attendance != null ? `${Math.round(attendance * 100)}%` : '—'}
        </Text>
        <Text className="mt-1 text-xs text-slate-400">Посещаемость</Text>
      </View>
      <View className="flex-1 items-center">
        <Text className="text-3xl font-extrabold text-slate-50">
          {totalMarks}
        </Text>
        <Text className="mt-1 text-xs text-slate-400">Оценок</Text>
      </View>
    </View>
  );
}

export default function GradesTab() {
  const { data, isLoading, isError, refetch } = useGrades();

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-slate-50">Оценки</Text>
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
          data={data.subjects}
          keyExtractor={(s) => String(s.subjectId)}
          renderItem={({ item }) => <SubjectCard item={item} />}
          ListHeaderComponent={
            <Summary
              average={data.overallAverage}
              attendance={data.attendanceRate}
              totalMarks={data.totalMarks}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-slate-400">
              Оценок пока нет
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
