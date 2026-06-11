import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { TeacherReview } from './types';

type RawReview = {
  date: string;
  message: string;
  spec: string;
  full_spec: string;
  teacher: string;
};

// Отзывы, новые сверху (API отдаёт старые первыми).
export async function fetchReviews(): Promise<TeacherReview[]> {
  const raw = await apiRequest<RawReview[]>(endpoints.reviews.list);
  return raw
    .map((r) => ({
      date: r.date,
      message: r.message,
      subject: r.full_spec,
      subjectShort: r.spec,
      teacher: r.teacher,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
