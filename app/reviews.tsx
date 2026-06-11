import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useReviews } from '@/features/reviews/useReviews';
import type { TeacherReview } from '@/features/reviews/types';
import { formatDate } from '@/lib/date';

function ReviewRow({ item }: { item: TeacherReview }) {
  return (
    <View className="mb-3 rounded-card bg-surface p-4">
      <View className="flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-xs text-muted" numberOfLines={1}>
          {item.subject}
        </Text>
        <Text className="text-xs text-faint">
          {formatDate(item.date.slice(0, 10))}
        </Text>
      </View>
      <Text className="mt-2 text-sm leading-5 text-body">
        {item.message}
      </Text>
      <Text className="mt-2 text-xs text-faint">{item.teacher}</Text>
    </View>
  );
}

export default function ReviewsScreen() {
  const { data, isLoading, isError, refetch } = useReviews();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScreenHeader title="Отзывы преподавателей" />

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
          data={data}
          keyExtractor={(r, i) => `${r.date}-${i}`}
          renderItem={({ item }) => <ReviewRow item={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-muted">
              Отзывов пока нет
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
