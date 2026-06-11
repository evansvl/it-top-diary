import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { ExamRecord } from './types';

type RawExam = {
  exam_id: number;
  date: string;
  spec: string;
  teacher: string;
  mark: number | null;
  mark_type: number | null;
};

// Все экзамены, новые сверху.
export async function fetchExams(): Promise<ExamRecord[]> {
  const raw = await apiRequest<RawExam[]>(endpoints.progress.studentExams);
  return raw
    .map((r) => ({
      id: r.exam_id,
      date: r.date,
      subject: r.spec,
      teacher: r.teacher,
      mark: r.mark,
      markType: r.mark_type,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
