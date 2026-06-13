// Доступное обновление приложения (релиз на GitHub).
export type UpdateInfo = {
  /** Версия без префикса "v", например "1.1.0" */
  version: string;
  /** Прямая ссылка на .apk из релиза (Android; на iOS обычно отсутствует) */
  apkUrl?: string;
  /** Размер .apk в байтах (если .apk есть в релизе) */
  sizeBytes?: number;
  /** Описание релиза (markdown из body) */
  notes: string;
  /** Страница релиза на GitHub */
  pageUrl: string;
};
