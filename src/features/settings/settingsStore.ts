import { create } from 'zustand';
import { loadAppSettings, saveAppSettings } from '@/lib/secureStore';
import type { ThemeMode } from '@/theme/colors';

// Пользовательские настройки приложения. Хранятся в SecureStore (app.settings),
// восстанавливаются при запуске из корневого layout.

export type AppSettings = {
  /** Проверять обновления на GitHub при запуске */
  autoCheckUpdates: boolean;
  /** Тема оформления (по умолчанию тёмная) */
  theme: ThemeMode;
};

const DEFAULTS: AppSettings = {
  autoCheckUpdates: true,
  theme: 'dark',
};

type SettingsState = AppSettings & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () => {
    const saved = await loadAppSettings<Partial<AppSettings>>();
    set({ ...DEFAULTS, ...saved, hydrated: true });
  },

  setSetting: (key, value) => {
    set({ [key]: value } as Pick<AppSettings, typeof key>);
    const { autoCheckUpdates, theme } = get();
    void saveAppSettings<AppSettings>({ autoCheckUpdates, theme });
  },
}));
