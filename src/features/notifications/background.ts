import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { runNotificationsSync } from './sync';

// Фоновая задача: периодически (минимум ~15 мин, реальный интервал решает ОС)
// проверяет новые оценки/ДЗ/новости и шлёт уведомления даже при закрытом
// приложении. На iOS система запускает задачи в своих окнах (часто ночью).

export const NOTIF_TASK = 'notif-sync-task';

TaskManager.defineTask(NOTIF_TASK, async () => {
  try {
    await runNotificationsSync();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

let registrationInFlight: Promise<void> | null = null;

export async function registerBackgroundSync(): Promise<void> {
  if (registrationInFlight) return registrationInFlight;

  registrationInFlight = (async () => {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;

    // Повторная регистрация обновляет параметры уже сохранённой задачи. 15 минут
    // — минимально допустимый интервал Android; реальный момент всё равно решает ОС.
    await BackgroundTask.registerTaskAsync(NOTIF_TASK, { minimumInterval: 15 });
  })();

  try {
    await registrationInFlight;
  } catch {
    // Регистрация может быть временно недоступна; foreground-синхронизация
    // продолжит работать, а следующий вызов повторит попытку.
  } finally {
    // Не запираем регистрацию навсегда при Restricted/ошибке: следующий вызов
    // сможет повторить попытку после смены системных условий.
    registrationInFlight = null;
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (registrationInFlight) {
    try {
      await registrationInFlight;
    } catch {
      /* регистрация уже не удалась — всё равно проверим нативное состояние */
    }
  }
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIF_TASK);
    if (isRegistered) await BackgroundTask.unregisterTaskAsync(NOTIF_TASK);
  } catch {
    /* ignore */
  }
  registrationInFlight = null;
}
