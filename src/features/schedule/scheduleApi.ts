import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { ScheduleDay, ScheduleLesson } from './types';

type RawLesson = {
  date: string;
  lesson: number;
  started_at: string;
  finished_at: string;
  teacher_name: string;
  subject_name: string;
  room_name: string;
};

// Расписание на месяц, сгруппированное по дням (дни и пары — по возрастанию).
export async function fetchScheduleMonth(
  dateFilter: string,
): Promise<ScheduleDay[]> {
  const raw = await apiRequest<RawLesson[]>(
    `${endpoints.schedule.getMonth}?date_filter=${dateFilter}`,
  );

  const byDay = new Map<string, ScheduleLesson[]>();
  for (const r of raw) {
    const lesson: ScheduleLesson = {
      date: r.date,
      lesson: r.lesson,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
      teacher: r.teacher_name,
      subject: r.subject_name,
      room: r.room_name,
    };
    const list = byDay.get(r.date);
    if (list) list.push(lesson);
    else byDay.set(r.date, [lesson]);
  }

  return [...byDay.entries()]
    .map(([date, lessons]) => ({
      date,
      lessons: lessons.sort((a, b) => a.lesson - b.lesson),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
