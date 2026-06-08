import { QueryClient } from '@tanstack/react-query';

// Единый клиент кэширования. Дефолты подобраны под мобильный сценарий:
// данные считаются свежими 1 минуту, повтор при ошибке — 1 раз.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
