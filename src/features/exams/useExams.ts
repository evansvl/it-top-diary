import { useQuery } from '@tanstack/react-query';
import { fetchExams } from './examsApi';

export function useExams() {
  return useQuery({
    queryKey: ['exams'],
    queryFn: fetchExams,
    staleTime: 5 * 60 * 1000,
  });
}
