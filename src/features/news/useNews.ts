import { useQuery } from '@tanstack/react-query';
import { fetchLatestNews, fetchNewsDetail } from './newsApi';

export function useLatestNews() {
  return useQuery({
    queryKey: ['news', 'latest'],
    queryFn: fetchLatestNews,
    staleTime: 5 * 60 * 1000,
  });
}

// id = null — деталка не открыта, запрос не идёт.
export function useNewsDetail(id: number | null) {
  return useQuery({
    queryKey: ['news', 'detail', id],
    enabled: id != null,
    queryFn: () => fetchNewsDetail(id as number),
    staleTime: 30 * 60 * 1000,
  });
}
