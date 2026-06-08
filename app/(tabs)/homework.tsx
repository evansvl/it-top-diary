import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHomeworkList } from '@/features/homework/useHomeworkList';
import {
  HOMEWORK_STATUSES,
  type HomeworkItem,
} from '@/features/homework/types';
import { useAuthStore } from '@/features/auth/authStore';
import { dayTitle, formatDate } from '@/lib/date';

function HomeworkRow({ item }: { item: HomeworkItem }) {
  const meta = HOMEWORK_STATUSES.find((s) => s.value === item.status);
  return (
    <View className="mb-3 flex-row rounded-card bg-ink-800 p-4">
      {item.coverImageUrl ? (
        <Image
          source={{ uri: item.coverImageUrl }}
          className="mr-3 h-14 w-14 rounded-2xl"
        />
      ) : null}
      <View className="flex-1">
        <Text className="text-xs text-slate-400" numberOfLines={1}>
          {item.subject}
        </Text>
        <Text
          className="mt-0.5 text-base font-semibold text-slate-50"
          numberOfLines={2}
        >
          {item.theme}
        </Text>
        <Text className="mt-1 text-xs text-slate-500" numberOfLines={1}>
          {item.teacher}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">
            Дедлайн {formatDate(item.overdueAt)}
          </Text>
          {item.mark != null ? (
            <Text className="text-xs font-semibold text-success">
              Оценка: {item.mark}
            </Text>
          ) : meta ? (
            <Text className={`text-xs font-medium ${meta.color}`}>
              {meta.label}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// Убираем дубликаты по id (API повторяет страницы вне диапазона).
function dedupeById(items: HomeworkItem[]): HomeworkItem[] {
  const seen = new Set<number>();
  return items.filter((it) => {
    if (seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });
}

// Группировка ДЗ по дню (по дате сдачи), новые сверху.
function groupByDay(items: HomeworkItem[]) {
  const map = new Map<string, HomeworkItem[]>();
  for (const it of items) {
    const arr = map.get(it.completeAt);
    if (arr) arr.push(it);
    else map.set(it.completeAt, [it]);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([date, data]) => ({ title: dayTitle(date), data }));
}

export default function HomeworkTab() {
  const groupId = useAuthStore((s) => s.user?.groupId);
  const [status, setStatus] = useState<number>(3);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHomeworkList(status, groupId);

  const sections = groupByDay(dedupeById(data?.pages.flat() ?? []));

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <View className="px-4 py-2">
        <Text className="text-xl font-bold text-slate-50">
          Домашние задания
        </Text>
      </View>

      {/* Табы статусов */}
      <View className="pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {HOMEWORK_STATUSES.map((s) => {
            const active = s.value === status;
            return (
              <Pressable
                key={s.value}
                onPress={() => setStatus(s.value)}
                className={`rounded-full px-3 py-1.5 ${
                  active ? 'bg-primary' : 'bg-ink-800'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    active ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {groupId == null ? (
        <Text className="px-4 text-sm text-slate-400">
          Группа не определена — войдите заново.
        </Text>
      ) : isLoading ? (
        <ActivityIndicator className="mt-8" color="#1E6FD9" />
      ) : isError ? (
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
        <SectionList
          sections={sections}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => <HomeworkRow item={item} />}
          renderSectionHeader={({ section }) => (
            <Text className="mb-2 mt-1 text-xs font-bold uppercase text-slate-400">
              {section.title}
            </Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-slate-400">
              Здесь пусто
            </Text>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="my-4" color="#1E6FD9" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
