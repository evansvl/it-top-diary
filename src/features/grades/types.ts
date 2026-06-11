// Вид оценки (по колонке в журнале).
export type MarkKind =
  | 'control'
  | 'home'
  | 'lab'
  | 'class'
  | 'practical'
  | 'final';

export const MARK_KIND_LABEL: Record<MarkKind, string> = {
  control: 'Контрольная',
  home: 'Домашняя',
  lab: 'Лабораторная',
  class: 'Классная',
  practical: 'Практическая',
  final: 'Итоговая',
};

export type Mark = {
  value: number;
  date: string; // date_visit (YYYY-MM-DD)
  kind: MarkKind;
};

export type SubjectGrades = {
  subjectId: number; // spec_id
  subject: string; // spec_name
  marks: Mark[]; // новые сверху
  average: number | null; // среднее по «обычным» оценкам (1..5)
};

// status_was: 1 — был, 0 — не был, 2 — особая отметка (семантика в API
// не подтверждена; считаем «не был» при расчёте посещаемости).
export type VisitStatus = 0 | 1 | 2;

export type LessonVisit = {
  date: string; // date_visit (YYYY-MM-DD)
  subject: string; // spec_name
  status: VisitStatus;
};

export const VISIT_STATUS_META: Record<
  VisitStatus,
  { label: string; text: string; bg: string }
> = {
  1: { label: 'Был', text: 'text-success', bg: 'bg-success/20' },
  0: { label: 'Не был', text: 'text-danger', bg: 'bg-danger/20' },
  2: { label: 'Особая отметка', text: 'text-warning', bg: 'bg-warning/20' },
};

export type GradesData = {
  subjects: SubjectGrades[]; // отсортированы по названию
  overallAverage: number | null; // средний балл по всем 1..5
  attendanceRate: number | null; // доля посещений 0..1
  attendancePresent: number; // посещено пар (status_was = 1)
  attendanceTotal: number; // всего пар с отметкой посещаемости
  totalMarks: number; // число «обычных» оценок
  visits: LessonVisit[]; // отметки посещаемости по парам (для расписания)
};

// Оценки одного предмета за конкретный день (для расписания).
export type DaySubjectMarks = {
  subject: string;
  marks: Mark[];
};

// Система 5-балльная: легаси-оценки старой 12-балльной шкалы (>5)
// отфильтрованы ещё в gradesApi и сюда не попадают.
export function markLabel(value: number): string {
  return String(value);
}

export function markColor(value: number): string {
  if (value >= 4 && value <= 5) return 'text-success';
  if (value === 3) return 'text-warning';
  if (value >= 0 && value <= 2) return 'text-danger';
  return 'text-slate-300';
}

export function markBg(value: number): string {
  if (value >= 4 && value <= 5) return 'bg-success/20';
  if (value >= 0 && value <= 2) return 'bg-danger/20';
  if (value === 3) return 'bg-warning/20';
  return 'bg-ink-700';
}
