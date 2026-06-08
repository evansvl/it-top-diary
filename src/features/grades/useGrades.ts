import { useQuery } from '@tanstack/react-query';
import { fetchGrades } from './gradesApi';

// Оценки + сводка (средний балл, посещаемость). Кэш 5 минут.
export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: fetchGrades,
    staleTime: 5 * 60 * 1000,
  });
}
