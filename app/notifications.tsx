import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import {
  useSettingsStore,
  type NotificationPrefs,
} from '@/features/settings/settingsStore';
import { enableNotificationsFlow } from '@/features/notifications/useNotifications';
import { cancelAllScheduled } from '@/features/notifications/notify';
import { unregisterBackgroundSync } from '@/features/notifications/background';

// Категории уведомлений (порядок = порядок в списке).
const CATEGORIES: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: 'deadlines', label: 'Дедлайны ДЗ', hint: 'Напоминать перед сдачей домашнего задания' },
  { key: 'grades', label: 'Новые оценки', hint: 'Когда в журнале появляется оценка' },
  { key: 'homeworkNew', label: 'Новое ДЗ', hint: 'Когда задают новое домашнее задание' },
  { key: 'homeworkChecked', label: 'Проверка работ', hint: 'Когда вашу работу проверили' },
  { key: 'exams', label: 'Экзамены', hint: 'Новые экзамены и их результаты' },
  { key: 'news', label: 'Новости', hint: 'Новости журнала' },
  { key: 'reviews', label: 'Отзывы', hint: 'Новые отзывы преподавателей' },
  { key: 'payments', label: 'Оплата', hint: 'Напоминания о платежах' },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-6 px-1 text-xs uppercase text-faint">{title}</Text>
  );
}

export default function NotificationsScreen() {
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotif = useSettingsStore((s) => s.setNotif);
  const master = notifications.enabled;

  const onToggleMaster = (value: boolean) => {
    if (value) {
      // Включение → спрашиваем системное разрешение.
      void enableNotificationsFlow();
    } else {
      setNotif('enabled', false);
      void cancelAllScheduled();
      void unregisterBackgroundSync();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScreenHeader title="Уведомления" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="overflow-hidden rounded-card bg-surface">
          <SettingsRow
            label="Уведомления"
            hint={
              master
                ? 'Включены — напоминания приходят на устройство'
                : 'Выключены — ничего приходить не будет'
            }
            switchValue={master}
            onSwitch={onToggleMaster}
          />
        </View>

        <SectionTitle title="Что присылать" />
        <View className="overflow-hidden rounded-card bg-surface">
          {CATEGORIES.map((c, i) => (
            <SettingsRow
              key={c.key}
              label={c.label}
              hint={c.hint}
              switchValue={notifications[c.key]}
              onSwitch={(v) => setNotif(c.key, v)}
              switchDisabled={!master}
              border={i < CATEGORIES.length - 1}
            />
          ))}
        </View>

        <Text className="mt-4 px-1 text-xs text-faint">
          Уведомления считаются на устройстве: часть приходит при открытии
          приложения, дедлайны и оплата планируются заранее и срабатывают даже
          при закрытом приложении.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
