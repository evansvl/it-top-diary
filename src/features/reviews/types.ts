// Отзывы преподавателей о студенте (/reviews/index/list).

export type TeacherReview = {
  date: string; // "YYYY-MM-DD HH:mm:ss"
  message: string;
  subject: string; // full_spec
  subjectShort: string; // spec
  teacher: string;
};
