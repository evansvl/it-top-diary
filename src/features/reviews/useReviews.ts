import { useQuery } from '@tanstack/react-query';
import { fetchReviews } from './reviewsApi';

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: fetchReviews,
    staleTime: 10 * 60 * 1000,
  });
}
