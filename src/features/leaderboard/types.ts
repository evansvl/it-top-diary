// Рейтинг по баллам (/dashboard/progress/leader-*).

export type LeaderEntry = {
  id: number; // student id (совпадает с userId из JWT)
  fullName: string;
  photo: string | null; // photo_path (fs.top-academy.ru, публичный)
  amount: number; // баллы
  position: number;
};

export type LeaderSelf = {
  totalCount: number;
  position: number;
  weekDiff: number;
  monthDiff: number;
};

export type LeaderboardData = {
  entries: LeaderEntry[];
  self: LeaderSelf | null;
};

export type LeaderboardScope = 'group' | 'stream';
