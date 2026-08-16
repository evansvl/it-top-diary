import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { listOrEmpty } from '@/api/response';
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
  const payload = await apiRequest<unknown>(endpoints.progress.studentExams);
  return listOrEmpty<RawExam>(payload)
    .map((r) => ({
      id: r.exam_id,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : '',
      subject:
        typeof r.spec === 'string' && r.spec.trim() ? r.spec.trim() : 'Экзамен',
      teacher: typeof r.teacher === 'string' ? r.teacher.trim() : '',
      mark: typeof r.mark === 'number' && Number.isFinite(r.mark) ? r.mark : null,
      markType:
        typeof r.mark_type === 'number' && Number.isFinite(r.mark_type)
          ? r.mark_type
          : null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
