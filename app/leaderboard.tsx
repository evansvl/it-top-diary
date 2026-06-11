import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import type {
  LeaderboardScope,
  LeaderEntry,
  LeaderSelf,
} from '@/features/leaderboard/types';
import { useAuthStore } from '@/features/auth/authStore';

const SCOPES: { value: LeaderboardScope; label: string }[] = [
  { value: 'group', label: 'Группа' },
  { value: 'stream', label: 'Поток' },
];

// Медальные цвета топ-3, дальше — нейтральный номер.
function positionColor(position: number): string {
  if (position === 1) return 'text-warning';
  if (position <= 3) return 'text-slate-200';
  return 'text-slate-500';
}

function LeaderRow({ item, isMe }: { item: LeaderEntry; isMe: boolean }) {
  return (
    <View
      className={`mb-2 flex-row items-center rounded-card p-3 ${
        isMe ? 'border border-primary bg-primary/10' : 'bg-ink-800'
      }`}
    >
      <Text className={`w-8 text-center text-base font-bold ${positionColor(item.position)}`}>
        {item.position}
      </Text>
      {item.photo ? (
        <Image
          source={{ uri: item.photo }}
          className="mx-2 h-9 w-9 rounded-full bg-ink-700"
        />
      ) : (
        <View className="mx-2 h-9 w-9 rounded-full bg-ink-700" />
      )}
      <Text
        className={`flex-1 pr-2 text-sm ${
          isMe ? 'font-bold text-slate-50' : 'text-slate-200'
        }`}
        numberOfLines={1}
      >
        {item.fullName}
      </Text>
      <Text className="text-sm font-semibold text-primary-light">
        {item.amount}
      </Text>
    </View>
  );
}

function SelfCard({ self }: { self: LeaderSelf }) {
  return (
    <View className="mb-3 rounded-card bg-ink-800 p-4">
      <Text className="text-sm text-slate-200">
        Твоё место:{' '}
        <Text className="font-bold text-primary-light">{self.position}</Text>
        {' из '}
        {self.totalCount}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [scope, setScope] = useState<LeaderboardScope>('group');
  const { data, isLoading, isError, refetch } = useLeaderboard(scope);
  const myId = useAuthStore((s) => (s.user?.id ? Number(s.user.id) : null));

  return (
    <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
      <ScreenHeader title="Рейтинг" />

      {/* Переключатель группа/поток */}
      <View className="mb-3 flex-row gap-2 px-4">
        {SCOPES.map((s) => {
          const active = s.value === scope;
          return (
            <Pressable
              key={s.value}
              onPress={() => setScope(s.value)}
              className={`rounded-full px-4 py-1.5 ${
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
          data={data.entries}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => (
            <LeaderRow item={item} isMe={myId != null && item.id === myId} />
          )}
          ListHeaderComponent={data.self ? <SelfCard self={data.self} /> : null}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-slate-400">
              Рейтинг пуст
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
