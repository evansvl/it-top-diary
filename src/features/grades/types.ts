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

export type GradesData = {
  subjects: SubjectGrades[]; // отсортированы по названию
  overallAverage: number | null; // средний балл по всем 1..5
  attendanceRate: number | null; // доля посещений 0..1
  totalMarks: number; // число «обычных» оценок
};

// 11 = зачёт, 12 = незачёт — особые коды (не входят в средний балл).
export function markLabel(value: number): string {
  if (value === 11) return 'зач';
  if (value === 12) return 'нз';
  return String(value);
}

export function markColor(value: number): string {
  if (value === 11) return 'text-success';
  if (value === 12) return 'text-danger';
  if (value >= 4 && value <= 5) return 'text-success';
  if (value === 3) return 'text-warning';
  if (value >= 0 && value <= 2) return 'text-danger';
  return 'text-slate-300';
}

export function markBg(value: number): string {
  if (value === 11 || (value >= 4 && value <= 5)) return 'bg-success/20';
  if (value === 12 || (value >= 0 && value <= 2)) return 'bg-danger/20';
  if (value === 3) return 'bg-warning/20';
  return 'bg-ink-700';
}
