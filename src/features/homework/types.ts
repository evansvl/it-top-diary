// Счётчики домашних заданий из GET /count/homework.
export type HomeworkCounts = {
  total: number; // всего (counter_type 4)
  todo: number; // надо сделать (3)
  onReview: number; // на проверке (2)
  checked: number; // проверено (1)
  overdue: number; // просрочено (0)
  deleted: number; // удалено (5)
};

// Один пункт списка GET /homework/operations/list (нормализованный).
export type HomeworkItem = {
  id: number;
  theme: string; // тема ДЗ
  subject: string; // name_spec — предмет
  teacher: string; // fio_teach
  createdAt: string; // creation_time (YYYY-MM-DD)
  completeAt: string; // completion_time
  overdueAt: string; // overdue_time (дедлайн)
  taskFileUrl: string | null; // file_path — файл задания
  coverImageUrl: string | null; // cover_image
  comment: string; // комментарий преподавателя
  status: number; // тот же код, что и status в запросе
  mark: number | null; // homework_stud.mark
  hasSubmission: boolean; // сдавал ли студент
};

// Статусы ДЗ = counter_type из /count/homework. Подписи и цвета — общие
// для табов списка и для отображения бейджа статуса.
export const HOMEWORK_STATUSES = [
  { value: 3, label: 'Надо сделать', color: 'text-primary-light' },
  { value: 2, label: 'На проверке', color: 'text-warning' },
  { value: 1, label: 'Проверено', color: 'text-success' },
  { value: 0, label: 'Просрочено', color: 'text-danger' },
] as const;
