import { useQuery } from '@tanstack/react-query';
import { fetchPayments } from './paymentsApi';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
    staleTime: 10 * 60 * 1000,
  });
}
