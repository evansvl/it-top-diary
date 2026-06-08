// Один урок в расписании.
export type ScheduleLesson = {
  date: string; // YYYY-MM-DD
  lesson: number; // номер пары
  startedAt: string; // «09:00»
  finishedAt: string; // «10:30»
  teacher: string;
  subject: string;
  room: string;
};

// Учебный день: дата + уроки (по порядку).
export type ScheduleDay = {
  date: string;
  lessons: ScheduleLesson[];
};
