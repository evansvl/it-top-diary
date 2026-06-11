import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLatestNews, useNewsDetail } from '@/features/news/useNews';
import type { NewsItem } from '@/features/news/types';
import { htmlToBlocks } from '@/lib/html';
import { formatDate } from '@/lib/date';
import { colors } from '@/theme/colors';

function NewsRow({ item, onPress }: { item: NewsItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-card bg-surface p-4 active:opacity-70"
    >
      <View className="flex-row items-start">
        {!item.viewed ? (
          <View className="mr-2 mt-1.5 h-2 w-2 rounded-full bg-primary" />
        ) : null}
        <Text className="flex-1 text-sm font-semibold text-title">
          {item.theme}
        </Text>
      </View>
      <Text className="mt-2 text-xs text-faint">
        {formatDate(item.time.slice(0, 10))}
      </Text>
    </Pressable>
  );
}

// Деталка новости: HTML разбираем на абзацы и картинки.
function NewsDetailModal({
  id,
  onClose,
}: {
  id: number | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useNewsDetail(id);
  const blocks = data ? htmlToBlocks(data.html) : [];

  return (
    <Modal
      visible={id != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        {/* Тап по затемнению — закрыть */}
        <Pressable className="flex-1" onPress={onClose} />
        <View className="max-h-[88%] rounded-t-3xl bg-surface px-5 pb-8 pt-4">
          <View className="mb-3 flex-row items-start justify-between">
            <Text className="flex-1 pr-3 text-lg font-bold text-title">
              {data?.theme ?? 'Новость'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} className="p-1">
              <Ionicons name="close" size={22} color={colors.dark.textMuted} />
            </Pressable>
          </View>

          {isLoading ? (
            <ActivityIndicator className="my-8" color="#1E6FD9" />
          ) : isError || !data ? (
            <Text className="my-8 text-center text-sm text-danger">
              Не удалось загрузить новость
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs text-faint">
                {formatDate(data.time.slice(0, 10))}
              </Text>
              {blocks.map((b, i) =>
                b.type === 'image' ? (
                  <Image
                    key={i}
                    source={{ uri: b.url }}
                    className="mt-3 w-full rounded-xl"
                    style={{ aspectRatio: 16 / 9 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text key={i} className="mt-3 text-sm leading-5 text-body">
                    {b.text}
                  </Text>
                ),
              )}
              <View className="h-4" />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function NewsScreen() {
  const { data, isLoading, isError, refetch } = useLatestNews();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScreenHeader title="Новости" />

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
          keyExtractor={(n) => String(n.id)}
          renderItem={({ item }) => (
            <NewsRow item={item} onPress={() => setSelectedId(item.id)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-sm text-muted">
              Новостей пока нет
            </Text>
          }
        />
      )}

      <NewsDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </SafeAreaView>
  );
}
