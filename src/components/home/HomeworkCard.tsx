import { ActivityIndicator, Text, View } from 'react-native';
import { useHomeworkCounts } from '@/features/homework/useHomeworkCounts';

// Одна колонка-счётчик статуса ДЗ.
function Cell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="mt-1 text-center text-xs text-muted">{label}</Text>
    </View>
  );
}

// Карточка-сводка по домашним заданиям (счётчики из /count/homework).
export function HomeworkCard() {
  const { data, isLoading, isError } = useHomeworkCounts();

  return (
    <View className="mt-4 rounded-card bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-title">
          Домашние задания
        </Text>
        <View className="flex-row items-center">
          {data ? (
            <Text className="text-sm text-muted">Всего: {data.total}</Text>
          ) : null}
          <Text className="ml-2 text-lg text-faint">›</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator className="my-5" color="#1E6FD9" />
      ) : isError || !data ? (
        <Text className="mt-3 text-sm text-danger">Не удалось загрузить</Text>
      ) : (
        <View className="mt-4 flex-row">
          <Cell label="Надо сделать" value={data.todo} color="text-primary-light" />
          <Cell label="На проверке" value={data.onReview} color="text-warning" />
          <Cell label="Проверено" value={data.checked} color="text-success" />
          <Cell label="Просрочено" value={data.overdue} color="text-danger" />
        </View>
      )}
    </View>
  );
}
