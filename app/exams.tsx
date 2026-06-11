import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useExams } from '@/features/exams/useExams';
import { isStandardExamMark, type ExamRecord } from '@/features/exams/types';
import { markBg, markColor } from '@/features/grades/types';
import { formatDate } from '@/lib/date';

function ExamRow({ item }: { item: ExamRecord }) {
  const standard = isStandardExamMark(item);
  return (
    <View className="mb-3 flex-row items-center rounded-card bg-ink-800 p-4">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-slate-50" numberOfLines={2}>
          {item.subject}
        </Text>
        <Text className="mt-1 text-xs text-slate-400" numberOfLines={1}>
          {item.teacher}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500">
          {formatDate(item.date)}
        </Text>
      </View>
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          standard ? markBg(item.mark ?? 0) : 'bg-ink-700'
        }`}
      >
        <Text
          className={`text-base font-extrabold ${
            standard ? markColor(item.mark ?? 0) : 'text-slate-300'
          }`}
        >
          {item.mark != null ? String(item.mark) : '—'}
        </Text>
      </View>
    </View>
  );
}

export default function ExamsScreen() {
  const { data, isLoading, isError, refetch } = useExams();

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <ScreenHeader title="Экзамены" />

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
          data={data}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => <ExamRow item={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-slate-400">
              Экзаменов пока нет
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
