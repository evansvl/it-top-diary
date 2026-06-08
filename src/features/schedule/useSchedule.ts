import { useQuery } from '@tanstack/react-query';
import { fetchScheduleMonth } from './scheduleApi';

// Расписание на месяц (ключ — якорная дата месяца). Кэш 5 минут.
export function useSchedule(monthAnchorIso: string) {
  return useQuery({
    queryKey: ['schedule', monthAnchorIso],
    queryFn: () => fetchScheduleMonth(monthAnchorIso),
    staleTime: 5 * 60 * 1000,
  });
}
