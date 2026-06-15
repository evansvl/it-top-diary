import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// ============================================================
//  Локальные уведомления (Android + iOS). Пуш-сервера нет —
//  всё считаем на устройстве: часть шлём сразу при синхронизации,
//  дедлайны/оплату планируем заранее (сработают и при закрытом
//  приложении).
// ============================================================

export const ANDROID_CHANNEL_ID = 'default';

// Показываем баннер/звук даже когда приложение открыто.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Уведомления',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#1E6FD9',
  });
  channelReady = true;
}

// Текущий статус разрешения (granted / denied / undetermined).
export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const res = await Notifications.getPermissionsAsync();
  return res.status;
}

export async function hasPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

// Спрашиваем разрешение (если ещё можно). Возвращает, дали ли его.
export async function requestPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    await ensureAndroidChannel();
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  if (req.granted) await ensureAndroidChannel();
  return req.granted;
}

// Немедленное уведомление.
export async function notifyNow(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}

// Запланированное на конкретную дату уведомление (дедлайны/оплата).
export async function notifyAt(
  date: Date,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

// Сбрасываем все ОТЛОЖЕННЫЕ уведомления (дедлайны/оплату) перед перепланом.
// Немедленные уже доставлены и сюда не попадают.
export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
