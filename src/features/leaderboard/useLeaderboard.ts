import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from './leaderboardApi';
import type { LeaderboardScope } from './types';

export function useLeaderboard(scope: LeaderboardScope) {
  return useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => fetchLeaderboard(scope),
    staleTime: 5 * 60 * 1000,
  });
}
