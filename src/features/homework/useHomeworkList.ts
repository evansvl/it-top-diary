import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchHomeworkList } from './homeworkApi';

// Список ДЗ по статусу с бесконечной подгрузкой страниц.
// API на страницах вне диапазона повторяет первую страницу, поэтому
// останавливаемся, когда очередная страница пуста ИЛИ не приносит новых id.
export function useHomeworkList(status: number, groupId: number | undefined) {
  return useInfiniteQuery({
    queryKey: ['homework', 'list', status, groupId],
    enabled: groupId != null,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchHomeworkList({ page: pageParam, status, groupId: groupId as number }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length === 0) return undefined;
      const prevIds = new Set(
        allPages.slice(0, -1).flatMap((p) => p.map((h) => h.id)),
      );
      const hasNew = lastPage.some((h) => !prevIds.has(h.id));
      return hasNew ? allPages.length + 1 : undefined;
    },
  });
}
