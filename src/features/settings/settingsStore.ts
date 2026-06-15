import { create } from 'zustand';
import { loadAppSettings, saveAppSettings } from '@/lib/secureStore';
import type { ThemeMode } from '@/theme/colors';

// Пользовательские настройки приложения. Хранятся в SecureStore (app.settings),
// восстанавливаются при запуске из корневого layout.

// Какие уведомления слать. enabled — общий выключатель (включается после
// выдачи разрешения системой), остальные — по категориям.
export type NotificationPrefs = {
  enabled: boolean;
  deadlines: boolean; // напоминания о дедлайнах ДЗ
  grades: boolean; // новые оценки в журнале
  homeworkNew: boolean; // новое ДЗ «надо сделать»
  homeworkChecked: boolean; // сданную работу проверили
  news: boolean; // новости журнала
  reviews: boolean; // новые отзывы преподавателей
  exams: boolean; // экзамены и их оценки
  payments: boolean; // напоминания об оплате
};

export type AppSettings = {
  /** Проверять обновления на GitHub при запуске */
  autoCheckUpdates: boolean;
  /** Тема оформления (по умолчанию тёмная) */
  theme: ThemeMode;
  /** Настройки уведомлений */
  notifications: NotificationPrefs;
  /** Версия, на которой показывали интро уведомлений (чтобы не спамить) */
  notifIntroVersion: string | null;
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  enabled: false, // включим после запроса разрешения у пользователя
  deadlines: true,
  grades: true,
  homeworkNew: true,
  homeworkChecked: true,
  news: true,
  reviews: true,
  exams: true,
  payments: true,
};

const DEFAULTS: AppSettings = {
  autoCheckUpdates: true,
  theme: 'dark',
  notifications: DEFAULT_NOTIFICATIONS,
  notifIntroVersion: null,
};

type SettingsState = AppSettings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setNotif: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => void;
};

function persist(s: AppSettings): void {
  void saveAppSettings<AppSettings>({
    autoCheckUpdates: s.autoCheckUpdates,
    theme: s.theme,
    notifications: s.notifications,
    notifIntroVersion: s.notifIntroVersion,
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    // hydrated должен стать true в любом случае — на нём держится сплэш
    // (app/_layout.tsx), иначе при сбое чтения хранилища он зависнет навсегда.
    try {
      const saved = await loadAppSettings<Partial<AppSettings>>();
      set({
        ...DEFAULTS,
        ...saved,
        // notifications мерджим по ключам — у старых сохранений могло не быть
        // новых категорий.
        notifications: { ...DEFAULT_NOTIFICATIONS, ...(saved?.notifications ?? {}) },
        hydrated: true,
      });
    } catch {
      set({ ...DEFAULTS, hydrated: true });
    }
  },

  setSetting: (key, value) => {
    set({ [key]: value } as Pick<AppSettings, typeof key>);
    persist(get());
  },

  setNotif: (key, value) => {
    set((s) => ({ notifications: { ...s.notifications, [key]: value } }));
    persist(get());
  },
}));
