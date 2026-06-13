import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { create } from 'zustand';
import { checkForUpdate } from './updatesApi';
import type { UpdateInfo } from './types';

// Состояние обновления — общее для проверки при запуске и экрана настроек
// (один источник, без повторных запросов к GitHub).

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'upToDate'
  | 'available'
  | 'downloading'
  | 'readyToInstall'
  | 'error';

type UpdatesState = {
  status: UpdateStatus;
  info: UpdateInfo | null;
  /** 0..1 во время загрузки .apk */
  progress: number;
  error: string | null;

  check: () => Promise<UpdateInfo | null>;
  downloadAndInstall: () => Promise<void>;
};

export const CURRENT_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export const useUpdatesStore = create<UpdatesState>((set, get) => ({
  status: 'idle',
  info: null,
  progress: 0,
  error: null,

  check: async () => {
    const { status, info } = get();
    if (status === 'checking' || status === 'downloading') return info;
    set({ status: 'checking', error: null });
    try {
      const found = await checkForUpdate(CURRENT_VERSION);
      set(
        found
          ? { status: 'available', info: found }
          : { status: 'upToDate', info: null },
      );
      return found;
    } catch (e) {
      set({
        status: 'error',
        error:
          e instanceof Error ? e.message : 'Не удалось проверить обновления',
      });
      return null;
    }
  },

  downloadAndInstall: async () => {
    const { info, status } = get();
    if (!info || status === 'downloading') return;
    if (Platform.OS !== 'android' || !info.apkUrl) return;

    const apkUrl = info.apkUrl;
    const apkPath = `${FileSystem.cacheDirectory}update-${info.version}.apk`;

    try {
      // Из readyToInstall повторно не качаем — пользователь мог отменить установщик
      if (status !== 'readyToInstall') {
        set({ status: 'downloading', progress: 0, error: null });
        const download = FileSystem.createDownloadResumable(
          apkUrl,
          apkPath,
          {},
          ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            const total =
              totalBytesExpectedToWrite > 0
                ? totalBytesExpectedToWrite
                : (info.sizeBytes ?? 0);
            if (total > 0) {
              set({ progress: Math.min(totalBytesWritten / total, 1) });
            }
          },
        );
        const result = await download.downloadAsync();
        if (!result) throw new Error('Загрузка прервана');
        set({ status: 'readyToInstall', progress: 1 });
      }

      // Системный установщик; нужен REQUEST_INSTALL_PACKAGES (app.json)
      const contentUri = await FileSystem.getContentUriAsync(apkPath);
      await IntentLauncher.startActivityAsync(
        'android.intent.action.INSTALL_PACKAGE',
        {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        },
      );
    } catch (e) {
      set({
        status: 'available',
        progress: 0,
        error:
          e instanceof Error ? e.message : 'Не удалось скачать обновление',
      });
    }
  },
}));
