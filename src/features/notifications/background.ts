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

let registered = false;

export async function registerBackgroundSync(): Promise<void> {
  if (registered) return;
  registered = true;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIF_TASK);
    if (!isRegistered) {
      // minimumInterval в минутах; ОС всё равно решает реальный интервал.
      await BackgroundTask.registerTaskAsync(NOTIF_TASK, { minimumInterval: 60 });
    }
  } catch {
    registered = false; // дадим шанс повторить позже
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIF_TASK);
    if (isRegistered) await BackgroundTask.unregisterTaskAsync(NOTIF_TASK);
  } catch {
    /* ignore */
  }
  registered = false;
}
