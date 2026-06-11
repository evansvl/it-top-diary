// Экзамены (/progress/operations/student-exams).

export type ExamRecord = {
  id: number; // exam_id
  date: string; // YYYY-MM-DD
  subject: string; // spec
  teacher: string;
  mark: number | null;
  // mark_type 1 — обычная оценка; прочие значения (например -20 при mark 20)
  // в API не документированы — такие оценки показываем нейтрально.
  markType: number | null;
};

// Обычная 5-балльная оценка (см. mark_type выше).
export function isStandardExamMark(e: ExamRecord): boolean {
  return e.markType === 1 && e.mark != null && e.mark >= 1 && e.mark <= 5;
}
