import { useEffect } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { CURRENT_VERSION } from '@/features/updates/updatesStore';
import { useAuthStore } from '@/features/auth/authStore';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { hasPermission, requestPermission } from './notify';
import { runNotificationsSync } from './sync';
import { registerBackgroundSync } from './background';

// Один раз за запуск — чтобы не показывать интро/синк по каждому ремаунту.
let introHandled = false;

// Запрос разрешения после выдачи (используется и интро, и экраном настроек).
export async function enableNotificationsFlow(): Promise<boolean> {
  const granted = await requestPermission();
  useSettingsStore.getState().setNotif('enabled', granted);
  if (granted) {
    void registerBackgroundSync();
    void runNotificationsSync();
  } else {
    Alert.alert(
      'Разрешение не выдано',
      'Система запретила уведомления — напоминания о дедлайнах ДЗ, оценках и других событиях приходить не будут. Включить можно в настройках телефона.',
      [
        { text: 'Закрыть', style: 'cancel' },
        { text: 'Открыть настройки', onPress: () => void Linking.openSettings() },
      ],
    );
  }
  return granted;
}

// Интро при первом запуске ИЛИ после обновления приложения (по смене версии).
async function runIntro(): Promise<void> {
  const { notifIntroVersion, setSetting, setNotif } = useSettingsStore.getState();
  // Показываем интро/новость об уведомлениях ОДИН РАЗ за всё время: при первой
  // установке или первом запуске после обновления со старой версии (где поля
  // ещё не было → null). После показа больше не беспокоим — даже на новых
  // обновлениях.
  if (notifIntroVersion !== null) return;

  setSetting('notifIntroVersion', CURRENT_VERSION);

  const alreadyGranted = await hasPermission();

  // Разрешение уже выдано (чаще после обновления) — включаем и рассказываем.
  if (alreadyGranted) {
    setNotif('enabled', true);
    void registerBackgroundSync();
    void runNotificationsSync();
    Alert.alert(
      '🔔 Уведомления',
      'Теперь приложение присылает напоминания о дедлайнах ДЗ, новых оценках, проверенных работах, новостях и не только. Настроить можно в «Настройки → Уведомления».',
      [{ text: 'Отлично' }],
    );
    return;
  }

  // Иначе спрашиваем разрешение с объяснением пользы.
  Alert.alert(
    '🔔 Включить уведомления?',
    'Будем напоминать о дедлайнах домашних заданий и сообщать о новых оценках, проверенных работах, новостях и отзывах. Без разрешения уведомления приходить не будут.',
    [
      {
        text: 'Не сейчас',
        style: 'cancel',
        onPress: () => {
          setNotif('enabled', false);
          Alert.alert(
            'Уведомления отключены',
            'Вы не будете получать напоминания о дедлайнах ДЗ, новых оценках и других событиях. Включить можно в любой момент в «Настройки → Уведомления».',
          );
        },
      },
      { text: 'Включить', onPress: () => void enableNotificationsFlow() },
    ],
  );
}

// Маунтится в layout вкладок: интро + синхронизация при входе и возврате из фона.
export function useNotifications(): void {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (!hydrated || status !== 'authenticated' || introHandled) return;
    introHandled = true;
    void runIntro();
  }, [hydrated, status]);

  useEffect(() => {
    if (!hydrated || status !== 'authenticated') return;

    const maybeSync = () => {
      if (!useSettingsStore.getState().notifications.enabled) return;
      void runNotificationsSync();
    };

    maybeSync();
    if (useSettingsStore.getState().notifications.enabled) {
      void registerBackgroundSync();
    }

    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') maybeSync();
    });
    return () => sub.remove();
  }, [hydrated, status]);
}
