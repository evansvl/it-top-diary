import { useQuery } from '@tanstack/react-query';
import { fetchHomeworkCounts } from './homeworkApi';

// Счётчики ДЗ для дашборда. Кэш 5 минут.
export function useHomeworkCounts() {
  return useQuery({
    queryKey: ['homework', 'counts'],
    queryFn: fetchHomeworkCounts,
    staleTime: 5 * 60 * 1000,
  });
}
