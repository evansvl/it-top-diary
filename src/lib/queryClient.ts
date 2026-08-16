import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { removeOldestQuery } from '@tanstack/react-query-persist-client';
import {
  OFFLINE_CACHE_BUSTER,
  OFFLINE_CACHE_MAX_AGE,
  shouldPersistQuery,
} from './offlineCachePolicy';

// Единый клиент кэширования. Дефолты подобраны под мобильный сценарий:
// данные считаются свежими 1 минуту, повтор при ошибке — 1 раз. Успешные
// ответы сохраняются локально на 7 дней для чтения без интернета.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Не удаляем данные из памяти раньше, чем их разрешено восстанавливать
      // с диска, иначе долгоживущий офлайн-кэш постепенно опустеет.
      gcTime: OFFLINE_CACHE_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'IT_TOP_QUERY_CACHE_V1',
  throttleTime: 1_000,
  // При лимите AsyncStorage уменьшаем кэш с самых старых данных и повторяем
  // запись, вместо того чтобы навсегда оставить на диске устаревшую копию.
  retry: removeOldestQuery,
});

export const queryPersistOptions = {
  persister: queryPersister,
  maxAge: OFFLINE_CACHE_MAX_AGE,
  buster: OFFLINE_CACHE_BUSTER,
  dehydrateOptions: {
    // Ошибки и незавершённые запросы не должны вытеснять последний успешный
    // ответ. meta.persist=false позволяет точечно исключать будущие запросы.
    shouldDehydrateQuery: shouldPersistQuery,
  },
};

// Используется при выходе, новом логине и ручной очистке. Кэш содержит оценки
// и ДЗ, поэтому нельзя оставлять его следующему аккаунту на этом устройстве.
export async function clearOfflineCache(): Promise<void> {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    // Память уже очищена; сбой дискового хранилища не должен ломать logout.
  }
}
