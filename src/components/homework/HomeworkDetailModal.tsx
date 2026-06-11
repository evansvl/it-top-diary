import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/api/client';
import type { SubmissionFile } from '@/features/homework/homeworkApi';
import { useSubmitHomework } from '@/features/homework/useSubmitHomework';
import {
  HOMEWORK_STATUSES,
  type HomeworkItem,
} from '@/features/homework/types';
import { downloadAndShare } from '@/lib/files';
import { formatDate } from '@/lib/date';
import { colors } from '@/theme/colors';

// Кнопка-строка «скачать файл» со спиннером на время загрузки.
function FileButton({ label, url, fallbackName }: {
  label: string;
  url: string;
  fallbackName: string;
}) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadAndShare(url, fallbackName);
    } catch (e) {
      Alert.alert(
        'Ошибка',
        e instanceof Error ? e.message : 'Не удалось скачать файл',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={() => void onPress()}
      className="mt-3 flex-row items-center rounded-xl bg-ink-700 px-4 py-3 active:opacity-70"
    >
      <Ionicons
        name={busy ? 'hourglass-outline' : 'download-outline'}
        size={18}
        color={colors.primaryLight}
      />
      <Text className="ml-2 flex-1 text-sm font-medium text-primary-light">
        {busy ? 'Загрузка…' : label}
      </Text>
    </Pressable>
  );
}

// Форма сдачи: ответ, файл, затраченное время.
function SubmitForm({
  item,
  onDone,
  title = 'Сдать работу',
}: {
  item: HomeworkItem;
  onDone: () => void;
  title?: string;
}) {
  const [answerText, setAnswerText] = useState('');
  const [file, setFile] = useState<SubmissionFile | null>(null);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const { mutate, isPending } = useSubmitHomework();

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = res.assets?.[0];
    if (!res.canceled && asset) {
      setFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? null,
      });
    }
  };

  const onSubmit = () => {
    if (!answerText.trim() && !file) {
      Alert.alert('Пустая работа', 'Прикрепите файл или напишите ответ.');
      return;
    }
    const clamp = (raw: string, max: number) =>
      Math.max(0, Math.min(max, Number.parseInt(raw, 10) || 0));
    mutate(
      {
        homeworkId: item.id,
        answerText: answerText.trim(),
        file,
        spentTimeHour: clamp(hours, 99),
        spentTimeMin: clamp(minutes, 59),
      },
      {
        onSuccess: () => {
          Alert.alert('Готово', 'Работа отправлена на проверку.');
          onDone();
        },
        onError: (e) => {
          Alert.alert(
            'Не удалось отправить',
            e instanceof ApiError ? e.message : 'Попробуйте ещё раз.',
          );
        },
      },
    );
  };

  return (
    <View className="mt-5">
      <Text className="mb-2 text-xs uppercase text-slate-500">{title}</Text>

      <TextInput
        value={answerText}
        onChangeText={setAnswerText}
        placeholder="Текст ответа (необязательно при наличии файла)"
        placeholderTextColor={colors.dark.textMuted}
        multiline
        textAlignVertical="top"
        className="min-h-[88px] rounded-xl border border-ink-600 bg-ink-900 px-4 py-3 text-sm text-slate-100"
      />

      <Pressable
        onPress={() => void pickFile()}
        className="mt-3 flex-row items-center rounded-xl border border-dashed border-ink-600 px-4 py-3 active:opacity-70"
      >
        <Ionicons
          name={file ? 'document-attach-outline' : 'attach-outline'}
          size={18}
          color={file ? colors.primaryLight : colors.dark.textMuted}
        />
        <Text
          className={`ml-2 flex-1 text-sm ${
            file ? 'text-primary-light' : 'text-slate-400'
          }`}
          numberOfLines={1}
        >
          {file ? file.name : 'Прикрепить файл'}
        </Text>
        {file ? (
          <Pressable onPress={() => setFile(null)} hitSlop={8}>
            <Ionicons name="close" size={18} color={colors.dark.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>

      <View className="mt-3 flex-row items-center">
        <Text className="mr-3 text-sm text-slate-400">Потрачено времени:</Text>
        <TextInput
          value={hours}
          onChangeText={setHours}
          keyboardType="number-pad"
          maxLength={2}
          className="w-12 rounded-lg border border-ink-600 bg-ink-900 px-2 py-1.5 text-center text-sm text-slate-100"
        />
        <Text className="mx-1.5 text-sm text-slate-400">ч</Text>
        <TextInput
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
          maxLength={2}
          className="w-12 rounded-lg border border-ink-600 bg-ink-900 px-2 py-1.5 text-center text-sm text-slate-100"
        />
        <Text className="mx-1.5 text-sm text-slate-400">мин</Text>
      </View>

      <View className="mt-4">
        <Button title="Отправить" loading={isPending} onPress={onSubmit} />
      </View>
    </View>
  );
}

// Сданная работа + пересдача при плохой оценке (та же форма, тот же
// эндпоинт create — веб-журнал шлёт его же повторно).
function SubmissionBlock({
  item,
  onDone,
}: {
  item: HomeworkItem;
  onDone: () => void;
}) {
  const [resubmitting, setResubmitting] = useState(false);
  const sub = item.submission;
  if (!sub) return null;

  // Пересдать можно, пока оценка низкая (1..3); 4–5 пересдавать незачем.
  const canResubmit = item.mark != null && item.mark < 4;

  return (
    <>
      <View className="mt-5 rounded-xl bg-ink-900 p-3">
        <Text className="text-xs uppercase text-slate-500">
          Сданная работа
          {sub.submittedAt ? ` · ${formatDate(sub.submittedAt)}` : ''}
        </Text>
        {sub.answerText ? (
          <Text className="mt-1 text-sm leading-5 text-slate-200">
            {sub.answerText}
          </Text>
        ) : null}
        {item.mark != null ? (
          <Text
            className={`mt-2 text-sm font-semibold ${
              canResubmit ? 'text-warning' : 'text-success'
            }`}
          >
            Оценка: {item.mark}
          </Text>
        ) : null}
        {sub.fileUrl ? (
          <FileButton
            label="Скачать мою работу"
            url={sub.fileUrl}
            fallbackName={`rabota-${item.id}`}
          />
        ) : null}
      </View>

      {canResubmit && !resubmitting ? (
        <Pressable
          onPress={() => setResubmitting(true)}
          className="mt-3 flex-row items-center justify-center rounded-xl border border-ink-600 px-4 py-3 active:opacity-70"
        >
          <Ionicons name="refresh-outline" size={18} color={colors.primaryLight} />
          <Text className="ml-2 text-sm font-medium text-primary-light">
            Пересдать работу
          </Text>
        </Pressable>
      ) : null}

      {resubmitting ? (
        <SubmitForm item={item} onDone={onDone} title="Пересдать работу" />
      ) : null}
    </>
  );
}

// Детали ДЗ: задание (скачивание файла), сданная работа или форма сдачи.
export function HomeworkDetailModal({
  item,
  onClose,
}: {
  item: HomeworkItem | null;
  onClose: () => void;
}) {
  const meta = item
    ? HOMEWORK_STATUSES.find((s) => s.value === item.status)
    : undefined;

  return (
    <Modal
      visible={item != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        {/* Тап по затемнению — закрыть */}
        <Pressable className="flex-1" onPress={onClose} />
        {item ? (
          <View className="max-h-[85%] rounded-t-3xl bg-ink-800 px-5 pb-8 pt-4">
            <View className="mb-3 flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs text-slate-400">{item.subject}</Text>
                <Text className="mt-1 text-lg font-bold text-slate-50">
                  {item.theme}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} className="p-1">
                <Ionicons name="close" size={22} color={colors.dark.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-xs text-slate-500">{item.teacher}</Text>
              <Text className="mt-1 text-xs text-slate-400">
                Выдано {formatDate(item.createdAt)} · дедлайн{' '}
                {formatDate(item.overdueAt)}
              </Text>
              {meta ? (
                <Text className={`mt-1 text-xs font-medium ${meta.color}`}>
                  {meta.label}
                </Text>
              ) : null}

              {item.comment ? (
                <View className="mt-4 rounded-xl bg-ink-900 p-3">
                  <Text className="text-xs uppercase text-slate-500">
                    Комментарий
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-slate-200">
                    {item.comment}
                  </Text>
                </View>
              ) : null}

              {item.taskFileUrl ? (
                <FileButton
                  label="Скачать задание"
                  url={item.taskFileUrl}
                  fallbackName={`zadanie-${item.id}`}
                />
              ) : null}

              {item.submission ? (
                <SubmissionBlock key={item.id} item={item} onDone={onClose} />
              ) : (
                <SubmitForm item={item} onDone={onClose} />
              )}
            </ScrollView>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
