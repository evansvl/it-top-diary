import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { HomeworkCounts, HomeworkItem, HomeworkSubmission } from './types';

// Сырой ответ: массив { counter_type, counter }.
type RawCount = { counter_type: number; counter: number };

// counter_type → семантика (подтверждено по реальному ответу):
// 0 — просрочено, 1 — проверено, 2 — на проверке,
// 3 — надо сделать, 4 — всего, 5 — удалено.
export async function fetchHomeworkCounts(): Promise<HomeworkCounts> {
  const raw = await apiRequest<RawCount[]>(endpoints.count.homework);
  const byType = new Map(raw.map((r) => [r.counter_type, r.counter]));
  const at = (type: number): number => byType.get(type) ?? 0;
  return {
    overdue: at(0),
    checked: at(1),
    onReview: at(2),
    todo: at(3),
    total: at(4),
    deleted: at(5),
  };
}

// Сданная работа: так же выглядит ответ /homework/operations/create.
type RawHomeworkStud = {
  id: number;
  filename: string | null;
  file_path: string | null;
  mark: number | null;
  creation_time: string | null;
  stud_answer: string | null;
  auto_mark: boolean;
};

// Сырой пункт списка ДЗ.
type RawHomework = {
  id: number;
  theme: string;
  name_spec: string;
  fio_teach: string;
  creation_time: string;
  completion_time: string;
  overdue_time: string;
  file_path: string | null;
  cover_image: string | null;
  comment: string;
  status: number;
  homework_stud: RawHomeworkStud | null;
};

function toSubmission(raw: RawHomeworkStud | null): HomeworkSubmission | null {
  if (!raw) return null;
  return {
    id: raw.id,
    answerText: raw.stud_answer,
    fileUrl: raw.file_path,
    submittedAt: raw.creation_time,
    mark: raw.mark,
  };
}

export type HomeworkListParams = {
  page: number;
  status: number; // 0..3 (как counter_type)
  groupId: number;
  type?: number; // вид ДЗ; в журнале 0
};

export async function fetchHomeworkList({
  page,
  status,
  groupId,
  type = 0,
}: HomeworkListParams): Promise<HomeworkItem[]> {
  const query = `?page=${page}&status=${status}&type=${type}&group_id=${groupId}`;
  const raw = await apiRequest<RawHomework[]>(
    `${endpoints.homework.list}${query}`,
  );
  return raw.map((r) => ({
    id: r.id,
    theme: r.theme,
    subject: r.name_spec,
    teacher: r.fio_teach,
    createdAt: r.creation_time,
    completeAt: r.completion_time,
    overdueAt: r.overdue_time,
    taskFileUrl: r.file_path,
    coverImageUrl: r.cover_image,
    comment: r.comment,
    status: r.status,
    mark: r.homework_stud?.mark ?? null,
    hasSubmission: r.homework_stud != null,
    submission: toSubmission(r.homework_stud),
  }));
}

// Файл для multipart-загрузки (из expo-document-picker).
export type SubmissionFile = {
  uri: string;
  name: string;
  mimeType: string | null;
};

export type SubmitHomeworkParams = {
  homeworkId: number;
  answerText: string;
  file: SubmissionFile | null;
  spentTimeHour: number;
  spentTimeMin: number;
};

// Сдача ДЗ — multipart, как в веб-журнале (поля подтверждены curl'ом).
export async function submitHomework({
  homeworkId,
  answerText,
  file,
  spentTimeHour,
  spentTimeMin,
}: SubmitHomeworkParams): Promise<HomeworkSubmission> {
  const form = new FormData();
  form.append('id', String(homeworkId));
  if (file) {
    // RN FormData принимает {uri, name, type} как файл
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);
  }
  form.append('answerText', answerText);
  form.append('spentTimeHour', String(spentTimeHour));
  form.append('spentTimeMin', String(spentTimeMin));

  const raw = await apiRequest<RawHomeworkStud>(endpoints.homework.create, {
    method: 'POST',
    body: form,
  });
  const submission = toSubmission(raw);
  if (!submission) throw new Error('Пустой ответ сервера');
  return submission;
}
