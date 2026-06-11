import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type {
  DaySubjectMarks,
  GradesData,
  LessonVisit,
  MarkKind,
  SubjectGrades,
} from './types';

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
  const visits: LessonVisit[] = [];
  let present = 0;
  let attendanceTotal = 0;

  for (const v of raw) {
    if (v.status_was === 0 || v.status_was === 1 || v.status_was === 2) {
      attendanceTotal += 1;
      if (v.status_was === 1) present += 1;
      visits.push({
        date: v.date_visit,
        subject: v.spec_name,
        status: v.status_was,
      });
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
      // 0 — оценка не выставлена (плейсхолдер журнала), >5 — легаси старой
      // 12-балльной системы; и то и другое не показываем вовсе
      if (typeof value === 'number' && value >= 1 && value <= 5) {
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
    attendancePresent: present,
    attendanceTotal,
    totalMarks: allStandard.length,
    visits,
  };
}

// Названия предметов в журнале (spec_name) и расписании (subject_name)
// сравниваем без учёта регистра/лишних пробелов.
export function normalizeSubject(name: string): string {
  return name.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

// Оценки, полученные в конкретный день, сгруппированные по предметам.
export function marksForDate(
  data: GradesData,
  date: string,
): DaySubjectMarks[] {
  const result: DaySubjectMarks[] = [];
  for (const s of data.subjects) {
    const marks = s.marks.filter((m) => m.date === date);
    if (marks.length > 0) result.push({ subject: s.subject, marks });
  }
  return result;
}

export type AttendanceSlice = {
  present: number;
  total: number;
  rate: number | null; // null — в периоде не было пар с отметкой
};

// Посещаемость за период [fromIso..toIso] включительно (ISO сравнивается
// лексикографически).
export function attendanceForRange(
  data: GradesData,
  fromIso: string,
  toIso: string,
): AttendanceSlice {
  let present = 0;
  let total = 0;
  for (const v of data.visits) {
    if (v.date < fromIso || v.date > toIso) continue;
    total += 1;
    if (v.status === 1) present += 1;
  }
  return { present, total, rate: total > 0 ? present / total : null };
}

// Отметки посещаемости за день: нормализованный предмет → статусы пар
// (в порядке записей журнала; на N-ю пару предмета берём N-й статус).
export function visitsForDate(
  data: GradesData,
  date: string,
): Map<string, LessonVisit['status'][]> {
  const map = new Map<string, LessonVisit['status'][]>();
  for (const v of data.visits) {
    if (v.date !== date) continue;
    const key = normalizeSubject(v.subject);
    const arr = map.get(key);
    if (arr) arr.push(v.status);
    else map.set(key, [v.status]);
  }
  return map;
}
