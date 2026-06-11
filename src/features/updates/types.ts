// Доступное обновление приложения (релиз на GitHub).
export type UpdateInfo = {
  /** Версия без префикса "v", например "1.1.0" */
  version: string;
  /** Прямая ссылка на .apk из релиза */
  apkUrl: string;
  /** Размер .apk в байтах */
  sizeBytes: number;
  /** Описание релиза (markdown из body) */
  notes: string;
  /** Страница релиза на GitHub */
  pageUrl: string;
};
