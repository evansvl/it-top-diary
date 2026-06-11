import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { useUpdatesStore } from './updatesStore';

// Один раз за запуск приложения (не за маунт компонента).
let checkedThisSession = false;

// Тихая проверка обновлений при входе в авторизованную зону.
// Нашли релиз новее — предлагаем открыть настройки; ошибки молча глотаем.
export function useAutoUpdateCheck() {
  const router = useRouter();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const autoCheckUpdates = useSettingsStore((s) => s.autoCheckUpdates);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!hydrated || !autoCheckUpdates || checkedThisSession) return;
    checkedThisSession = true;

    void useUpdatesStore
      .getState()
      .check()
      .then((info) => {
        if (!info) return;
        Alert.alert(
          `Доступна версия ${info.version}`,
          'Скачать и установить обновление можно в настройках.',
          [
            { text: 'Позже', style: 'cancel' },
            { text: 'Подробнее', onPress: () => router.push('/settings') },
          ],
        );
      });
  }, [hydrated, autoCheckUpdates, router]);
}
