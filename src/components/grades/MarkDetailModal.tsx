import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MARK_KIND_LABEL,
  markBg,
  markColor,
  markLabel,
  type Mark,
} from '@/features/grades/types';
import {
  findHomeworkForMark,
  useCheckedHomework,
} from '@/features/homework/useCheckedHomework';
import type { HomeworkItem } from '@/features/homework/types';
import { useAuthStore } from '@/features/auth/authStore';
import { dayTitle, formatDate } from '@/lib/date';
import { colors } from '@/theme/colors';

export type MarkDetail = { subject: string; mark: Mark };

// Блок «за какое ДЗ»: ищем оценку среди проверенных работ и даём открыть её.
function HomeworkMatch({
  detail,
  onOpenHomework,
}: {
  detail: MarkDetail;
  onOpenHomework: (item: HomeworkItem) => void;
}) {
  const groupId = useAuthStore((s) => s.user?.groupId);
  const { data, isLoading } = useCheckedHomework(groupId, true);
  const homework = data
    ? findHomeworkForMark(
        data,
        detail.subject,
        detail.mark.value,
        detail.mark.date,
      )
    : null;

  return (
    <View className="mt-5">
      <Text className="mb-2 text-xs uppercase text-slate-500">
        Домашнее задание
      </Text>
      {isLoading ? (
        <View className="flex-row items-center rounded-xl bg-ink-900 p-3">
          <ActivityIndicator size="small" color={colors.primaryLight} />
          <Text className="ml-3 text-sm text-slate-400">Ищем задание…</Text>
        </View>
      ) : homework ? (
        <Pressable
          onPress={() => onOpenHomework(homework)}
          className="flex-row items-center rounded-xl bg-ink-900 p-3 active:opacity-70"
        >
          <View className="flex-1 pr-2">
            <Text
              className="text-sm font-semibold text-slate-50"
              numberOfLines={2}
            >
              {homework.theme}
            </Text>
            <Text className="mt-1 text-xs text-slate-500" numberOfLines={1}>
              {homework.teacher}
            </Text>
            <Text className="mt-1 text-xs text-slate-400">
              Дедлайн {formatDate(homework.overdueAt)}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.dark.textMuted}
          />
        </Pressable>
      ) : (
        <Text className="text-sm leading-5 text-slate-400">
          Не удалось сопоставить оценку с конкретным заданием — журнал не
          хранит эту связь.
        </Text>
      )}
    </View>
  );
}

// Детали оценки: за что получена (вид работы, предмет, дата) и, для
// домашних, — само ДЗ из списка проверенных.
export function MarkDetailModal({
  detail,
  onClose,
  onOpenHomework,
}: {
  detail: MarkDetail | null;
  onClose: () => void;
  onOpenHomework: (item: HomeworkItem) => void;
}) {
  return (
    <Modal
      visible={detail != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        {/* Тап по затемнению — закрыть */}
        <Pressable className="flex-1" onPress={onClose} />
        {detail ? (
          <View className="rounded-t-3xl bg-ink-800 px-5 pb-8 pt-4">
            <View className="flex-row items-center">
              <View
                className={`h-12 w-12 items-center justify-center rounded-xl ${markBg(
                  detail.mark.value,
                )}`}
              >
                <Text
                  className={`text-xl font-extrabold ${markColor(
                    detail.mark.value,
                  )}`}
                >
                  {markLabel(detail.mark.value)}
                </Text>
              </View>
              <View className="ml-3 flex-1 pr-3">
                <Text className="text-base font-bold text-slate-50">
                  {MARK_KIND_LABEL[detail.mark.kind]} работа
                </Text>
                <Text className="mt-0.5 text-xs text-slate-400">
                  {detail.subject}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} className="p-1">
                <Ionicons name="close" size={22} color={colors.dark.textMuted} />
              </Pressable>
            </View>

            <Text className="mt-3 text-sm text-slate-400">
              Получена: {dayTitle(detail.mark.date)}
            </Text>

            {detail.mark.kind === 'home' ? (
              <HomeworkMatch detail={detail} onOpenHomework={onOpenHomework} />
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
