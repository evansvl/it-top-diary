import { useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { useUpdatesStore } from './updatesStore';

// Один раз за запуск приложения (не за маунт компонента).
let checkedThisSession = false;

// Тихая проверка обновлений при входе в авторизованную зону (Android и iOS).
// Нашли релиз новее — сообщаем; ошибки молча глотаем.
//  • Android — установщик прямо в приложении (ведём в настройки).
//  • iOS — .ipa так не поставить, поэтому просто ведём на релиз в GitHub.
export function useAutoUpdateCheck() {
  const router = useRouter();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const autoCheckUpdates = useSettingsStore((s) => s.autoCheckUpdates);

  useEffect(() => {
    if (!hydrated || !autoCheckUpdates || checkedThisSession) return;
    checkedThisSession = true;

    void useUpdatesStore
      .getState()
      .check()
      .then((info) => {
        if (!info) return;
        const isAndroid = Platform.OS === 'android';
        Alert.alert(
          `Доступна версия ${info.version}`,
          isAndroid
            ? 'Скачать и установить обновление можно в настройках.'
            : 'Открой страницу релиза на GitHub, чтобы скачать новую версию.',
          [
            { text: 'Позже', style: 'cancel' },
            isAndroid
              ? { text: 'Подробнее', onPress: () => router.push('/settings') }
              : {
                  text: 'Открыть на GitHub',
                  onPress: () => void Linking.openURL(info.pageUrl),
                },
          ],
        );
      });
  }, [hydrated, autoCheckUpdates, router]);
}
