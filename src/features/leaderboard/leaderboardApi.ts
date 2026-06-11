import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type {
  LeaderboardData,
  LeaderboardScope,
  LeaderEntry,
  LeaderSelf,
} from './types';

type RawLeader = {
  id: number;
  full_name: string;
  photo_path: string | null;
  amount: number;
  position: number;
};

type RawSelf = {
  totalCount: number;
  studentPosition: number;
  weekDiff: number;
  monthDiff: number;
};

// Топ + собственная позиция (вторым запросом, *-points).
export async function fetchLeaderboard(
  scope: LeaderboardScope,
): Promise<LeaderboardData> {
  const listPath =
    scope === 'group'
      ? endpoints.dashboard.leaderGroup
      : endpoints.dashboard.leaderStream;
  const selfPath =
    scope === 'group'
      ? endpoints.dashboard.leaderGroupPoints
      : endpoints.dashboard.leaderStreamPoints;

  const [rawList, rawSelf] = await Promise.all([
    apiRequest<RawLeader[]>(listPath),
    apiRequest<RawSelf | null>(selfPath),
  ]);

  const entries: LeaderEntry[] = rawList
    .map((r) => ({
      id: r.id,
      fullName: r.full_name.trim(),
      photo: r.photo_path,
      amount: r.amount,
      position: r.position,
    }))
    .sort((a, b) => a.position - b.position);

  const self: LeaderSelf | null = rawSelf
    ? {
        totalCount: rawSelf.totalCount,
        position: rawSelf.studentPosition,
        weekDiff: rawSelf.weekDiff,
        monthDiff: rawSelf.monthDiff,
      }
    : null;

  return { entries, self };
}
