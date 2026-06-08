import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { GradesData, MarkKind, SubjectGrades } from './types';

// Колонки оценок в записи журнала.
type MarkColumn =
  | 'control_work_mark'
  | 'home_work_mark'
  | 'lab_work_mark'
  | 'class_work_mark'
  | 'practical_work_mark'
  | 'final_work_mark';

type RawVisit = {
  date_visit: string;
  status_was: number | null; // 1 — был, 0 — не был, 2 — особое, null — нет данных
  spec_id: number;
  spec_name: string;
} & Record<MarkColumn, number | null>;

const MARK_COLUMNS: { col: MarkColumn; kind: MarkKind }[] = [
  { col: 'control_work_mark', kind: 'control' },
  { col: 'home_work_mark', kind: 'home' },
  { col: 'lab_work_mark', kind: 'lab' },
  { col: 'class_work_mark', kind: 'class' },
  { col: 'practical_work_mark', kind: 'practical' },
  { col: 'final_work_mark', kind: 'final' },
];

// «Обычная» оценка для среднего (1..5). 0/6/11/12 — вне расчёта.
function isStandard(value: number): boolean {
  return value >= 1 && value <= 5;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

// Тянем весь журнал и сворачиваем в оценки по предметам + сводку.
export async function fetchGrades(): Promise<GradesData> {
  const raw = await apiRequest<RawVisit[]>(endpoints.progress.studentVisits);

  const subjects = new Map<number, SubjectGrades>();
  let present = 0;
  let attendanceTotal = 0;

  for (const v of raw) {
    if (v.status_was === 0 || v.status_was === 1 || v.status_was === 2) {
      attendanceTotal += 1;
      if (v.status_was === 1) present += 1;
    }

    let subj = subjects.get(v.spec_id);
    if (!subj) {
      subj = {
        subjectId: v.spec_id,
        subject: v.spec_name,
        marks: [],
        average: null,
      };
      subjects.set(v.spec_id, subj);
    }
    for (const { col, kind } of MARK_COLUMNS) {
      const value = v[col];
      if (typeof value === 'number') {
        subj.marks.push({ value, date: v.date_visit, kind });
      }
    }
  }

  const allStandard: number[] = [];
  const list = [...subjects.values()].filter((s) => s.marks.length > 0);
  for (const s of list) {
    s.marks.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const std = s.marks.map((m) => m.value).filter(isStandard);
    s.average = average(std);
    allStandard.push(...std);
  }
  list.sort((a, b) => a.subject.localeCompare(b.subject, 'ru'));

  return {
    subjects: list,
    overallAverage: average(allStandard),
    attendanceRate: attendanceTotal > 0 ? present / attendanceTotal : null,
    totalMarks: allStandard.length,
  };
}
