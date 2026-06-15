import * as FileSystem from 'expo-file-system/legacy';

// Снимок «что мы уже видели» — чтобы при следующей синхронизации показать
// уведомления только о НОВОМ. Храним в файле (а не в SecureStore — там лимит
// ~2 КБ, а оценок/новостей может быть много).

const FILE = `${FileSystem.documentDirectory}notif-snapshot.json`;

export type NotifSnapshot = {
  initialized: boolean; // первый прогон только записывает состояние, без уведомлений
  gradeCountBySubject: Record<string, number>; // spec_id → число оценок
  examKeys: string[]; // `${id}:${mark}`
  reviewKeys: string[]; // `${date}|${teacher}`
  newsIds: number[];
  hwTodoIds: number[]; // id ДЗ со статусом «надо сделать»
  hwCheckedKeys: string[]; // `${id}:${mark}` проверенных работ
};

export const EMPTY_SNAPSHOT: NotifSnapshot = {
  initialized: false,
  gradeCountBySubject: {},
  examKeys: [],
  reviewKeys: [],
  newsIds: [],
  hwTodoIds: [],
  hwCheckedKeys: [],
};

export async function loadSnapshot(): Promise<NotifSnapshot> {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return { ...EMPTY_SNAPSHOT };
    const raw = await FileSystem.readAsStringAsync(FILE);
    return { ...EMPTY_SNAPSHOT, ...(JSON.parse(raw) as Partial<NotifSnapshot>) };
  } catch {
    return { ...EMPTY_SNAPSHOT };
  }
}

export async function saveSnapshot(snap: NotifSnapshot): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(FILE, JSON.stringify(snap));
  } catch {
    /* не критично — в следующий раз просто пересоберём */
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await FileSystem.deleteAsync(FILE, { idempotent: true });
  } catch {
    /* ignore */
  }
}
